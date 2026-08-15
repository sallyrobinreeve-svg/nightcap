import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../data/prompt_privacy.dart';
import '../data/prompts.dart';
import '../models/entry_models.dart';
import '../services/content_filter.dart';
import '../services/entry_service.dart';
import '../theme.dart';
import '../widgets/night_widgets.dart';
import '../widgets/social_widgets.dart';
import '../widgets/video_player_widget.dart';
import 'entry_editor_screen.dart';

class EntryDetailScreen extends StatefulWidget {
  const EntryDetailScreen({required this.entryId, super.key});

  final String entryId;

  @override
  State<EntryDetailScreen> createState() => _EntryDetailScreenState();
}

class _EntryDetailScreenState extends State<EntryDetailScreen> {
  late Future<EntryDetail> _future = entryService.fetch(widget.entryId);
  final _comment = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  void _reload() {
    setState(() => _future = entryService.fetch(widget.entryId));
  }

  Future<void> _toggleReaction(String type, String? current) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await entryService.toggleReaction(
        entryId: widget.entryId,
        type: type,
        currentType: current,
      );
      _reload();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addComment() async {
    final text = _comment.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() => _busy = true);
    try {
      await entryService.addComment(entryId: widget.entryId, content: text);
      _comment.clear();
      _reload();
    } on ContentFilterException {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(ContentFilterException.message)),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _deleteEntry() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete entry?'),
        content: const Text('This permanently removes this recap.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await entryService.deleteEntry(widget.entryId);
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recap'),
        backgroundColor: NightColors.background,
        foregroundColor: Colors.white,
        actions: [
          FutureBuilder<EntryDetail>(
            future: _future,
            builder: (context, snapshot) {
              if (!snapshot.hasData || !snapshot.data!.isMine) {
                return const SizedBox.shrink();
              }
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    tooltip: 'Edit',
                    onPressed: () async {
                      final updated = await Navigator.of(context).push<bool>(
                        MaterialPageRoute<bool>(
                          builder: (_) =>
                              EntryEditorScreen(entryId: widget.entryId),
                        ),
                      );
                      if (updated == true) _reload();
                    },
                    icon: const Icon(Icons.edit_outlined),
                  ),
                  IconButton(
                    tooltip: 'Delete',
                    onPressed: _deleteEntry,
                    icon: const Icon(Icons.delete_outline),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              NightColors.background,
              Color(0xFF34243A),
              NightColors.background,
            ],
          ),
        ),
        child: FutureBuilder<EntryDetail>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return Center(
                child: ErrorCard(
                  message: 'Could not load this recap.',
                  onRetry: _reload,
                ),
              );
            }
            final detail = snapshot.data!;
            return _DetailBody(
              detail: detail,
              commentController: _comment,
              busy: _busy,
              onToggleReaction: _toggleReaction,
              onAddComment: _addComment,
              onDeleteComment: (id) async {
                await entryService.deleteComment(id);
                _reload();
              },
              onBlocked: () => Navigator.of(context).pop(),
            );
          },
        ),
      ),
    );
  }
}

class _DetailBody extends StatelessWidget {
  const _DetailBody({
    required this.detail,
    required this.commentController,
    required this.busy,
    required this.onToggleReaction,
    required this.onAddComment,
    required this.onDeleteComment,
    required this.onBlocked,
  });

  final EntryDetail detail;
  final TextEditingController commentController;
  final bool busy;
  final void Function(String type, String? current) onToggleReaction;
  final Future<void> Function() onAddComment;
  final void Function(String id) onDeleteComment;
  final VoidCallback onBlocked;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(detail.dateOfNight);
    final promptEntries = <(String, String)>[];
    for (final entry in detail.prompts.entries) {
      final key = entry.key;
      final value = entry.value;
      if (isPromptMetadataKey(key)) continue;
      if (key == 'kissedWho') continue;
      if (value == null || value.toString().trim().isEmpty) continue;

      if (!detail.isMine && isPromptPrivate(detail.prompts, key)) {
        promptEntries.add((promptDisplayLabel(key), '(Private)'));
        continue;
      }

      var display = value.toString();
      if (key == 'kissedAnyone') {
        display = kissedAnyoneValue(value) ? 'Yes' : 'No';
        final who = detail.prompts['kissedWho'];
        if (who != null && who.toString().trim().isNotEmpty) {
          display = '$display — ${who.toString()}';
        }
      }
      if (detail.isMine && isPromptPrivate(detail.prompts, key)) {
        display = '$display (private)';
      }
      promptEntries.add((promptDisplayLabel(key), display));
    }

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        NightCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      date == null
                          ? detail.dateOfNight
                          : DateFormat.yMMMMd().format(date),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (!detail.isMine)
                    ReportBlockMenu(
                      reportedUserId: detail.userId,
                      entryId: detail.id,
                      onChanged: onBlocked,
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'by ${detail.authorName ?? 'NightCapt user'}',
                style: const TextStyle(color: NightColors.accent),
              ),
              if (detail.taggedProfiles.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'With ${detail.taggedProfiles.map((p) => p.name).join(', ')}',
                  style: const TextStyle(color: NightColors.muted),
                ),
              ],
              if (detail.rating != null) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    for (var i = 1; i <= 5; i++)
                      Icon(
                        i <= detail.rating! ? Icons.star : Icons.star_border,
                        color: NightColors.yellow,
                      ),
                  ],
                ),
              ],
              if (detail.photoUrls.isNotEmpty) ...[
                const SizedBox(height: 16),
                SizedBox(
                  height: 220,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: detail.photoUrls.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (_, i) => ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        detail.photoUrls[i],
                        width: 200,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
              ],
              if (detail.videoUrl != null) ...[
                const SizedBox(height: 16),
                NightVideoPlayer(url: detail.videoUrl!),
              ],
              for (final (label, value) in promptEntries) ...[
                const SizedBox(height: 16),
                Text(label, style: const TextStyle(color: NightColors.muted)),
                const SizedBox(height: 4),
                Text(value),
              ],
              if (detail.timeline.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text('Timeline', style: TextStyle(fontWeight: FontWeight.bold)),
                for (final step in detail.timeline)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Text(step.emoji ?? '🌙', style: const TextStyle(fontSize: 22)),
                    title: Text(step.type),
                    subtitle: Text(
                      [
                        if (step.locationName != null) step.locationName,
                        if (step.notes != null) step.notes,
                      ].whereType<String>().join(' · '),
                    ),
                  ),
              ],
              const SizedBox(height: 20),
              ReactionBar(
                counts: detail.reactionCounts,
                myType: detail.myReactionType,
                onToggle: (type) => onToggleReaction(type, detail.myReactionType),
                busy: busy,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        NightCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Comments', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 12),
              if (detail.comments.isEmpty)
                const Text('No comments yet.', style: TextStyle(color: NightColors.muted))
              else
                for (final comment in detail.comments)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                comment.authorName ?? 'User',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: NightColors.accent,
                                ),
                              ),
                              Text(comment.content),
                            ],
                          ),
                        ),
                        if (comment.userId == detail.currentUserId)
                          IconButton(
                            onPressed: () => onDeleteComment(comment.id),
                            icon: const Icon(Icons.delete_outline, size: 18),
                          )
                        else
                          ReportBlockMenu(
                            reportedUserId: comment.userId,
                            entryId: detail.id,
                            commentId: comment.id,
                          ),
                      ],
                    ),
                  ),
              const SizedBox(height: 12),
              TextField(
                controller: commentController,
                decoration: nightInputDecoration('Add a comment'),
                maxLines: 2,
              ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: busy ? null : onAddComment,
                  child: const Text('Post comment'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
