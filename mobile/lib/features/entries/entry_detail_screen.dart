import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../theme.dart';
import '../feed/feed_controller.dart';
import 'entry_detail.dart';
import 'entry_detail_repository.dart';

const _promptLabels = <String, String>{
  'drunkest': 'Who was drunkest',
  'funniest': 'Funniest moment',
  'mission': 'Mission of the night',
  'success': 'Mission accomplished?',
  'kissedWho': 'Who kissed who',
};

class EntryDetailScreen extends ConsumerStatefulWidget {
  const EntryDetailScreen({super.key, required this.entryId});

  final String entryId;

  @override
  ConsumerState<EntryDetailScreen> createState() => _EntryDetailScreenState();
}

class _EntryDetailScreenState extends ConsumerState<EntryDetailScreen> {
  final _comment = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  void _invalidate() {
    ref.invalidate(entryDetailProvider(widget.entryId));
    // Feed shows reaction/comment counts, so refresh it too.
    ref.read(feedControllerProvider.notifier).refresh();
  }

  Future<void> _toggleReaction(String type, String? current) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(entryDetailRepositoryProvider).toggleReaction(
            entryId: widget.entryId,
            type: type,
            currentType: current,
          );
      _invalidate();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addComment() async {
    final text = _comment.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(entryDetailRepositoryProvider)
          .addComment(entryId: widget.entryId, content: text);
      _comment.clear();
      if (mounted) FocusScope.of(context).unfocus();
      _invalidate();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _deleteComment(String id) async {
    setState(() => _busy = true);
    try {
      await ref.read(entryDetailRepositoryProvider).deleteComment(id);
      _invalidate();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(entryDetailProvider(widget.entryId));

    return Scaffold(
      appBar: AppBar(title: const Text('Recap')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator(color: kAccent)),
        error: (_, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Could not load this recap.', style: TextStyle(color: Colors.redAccent)),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => ref.invalidate(entryDetailProvider(widget.entryId)),
                child: const Text('Retry', style: TextStyle(color: kAccent)),
              ),
            ],
          ),
        ),
        data: (d) => _DetailBody(
          detail: d,
          commentController: _comment,
          busy: _busy,
          onToggleReaction: _toggleReaction,
          onAddComment: _addComment,
          onDeleteComment: _deleteComment,
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
  });

  final EntryDetail detail;
  final TextEditingController commentController;
  final bool busy;
  final void Function(String type, String? current) onToggleReaction;
  final Future<void> Function() onAddComment;
  final void Function(String id) onDeleteComment;

  String _formatDate() {
    try {
      return DateFormat('EEEE, MMM d, yyyy').format(DateTime.parse(detail.dateOfNight));
    } catch (_) {
      return detail.dateOfNight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final prompts = [
      for (final entry in detail.prompts.entries)
        if (entry.value is String && (entry.value as String).trim().isNotEmpty)
          (_promptLabels[entry.key] ?? entry.key, entry.value as String),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      children: [
        Text(
          _formatDate(),
          style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text('by ${detail.authorName ?? 'Anonymous'}', style: const TextStyle(color: kAccent)),
        if (detail.rating != null) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              for (var i = 1; i <= 5; i++)
                Icon(
                  i <= detail.rating! ? Icons.star : Icons.star_border,
                  color: kAccent,
                  size: 22,
                ),
            ],
          ),
        ],
        if (detail.photoUrls.isNotEmpty) ...[
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: detail.photoUrls.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (_, i) => ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(detail.photoUrls[i], width: 200, fit: BoxFit.cover),
              ),
            ),
          ),
        ],
        for (final (label, value) in prompts) ...[
          const SizedBox(height: 16),
          Text(label, style: const TextStyle(color: kMuted, fontSize: 13)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 16)),
        ],
        if (detail.timeline.isNotEmpty) ...[
          const SizedBox(height: 24),
          const Text('Timeline', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 8),
          for (final step in detail.timeline)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                '• ${step.type[0].toUpperCase()}${step.type.substring(1)}'
                '${step.locationName != null ? ' — ${step.locationName}' : ''}'
                '${step.notes != null ? ': ${step.notes}' : ''}',
                style: const TextStyle(color: kMuted),
              ),
            ),
        ],
        const SizedBox(height: 24),
        _ReactionBar(
          counts: detail.reactionCounts,
          mine: detail.myReactionType,
          busy: busy,
          onTap: onToggleReaction,
        ),
        const Divider(height: 40, color: kSurface),
        Text(
          'Comments (${detail.comments.length})',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16),
        ),
        const SizedBox(height: 12),
        if (detail.comments.isEmpty)
          const Text('No comments yet. Be the first.', style: TextStyle(color: kMuted)),
        for (final c in detail.comments)
          _CommentTile(
            comment: c,
            onDelete: (!busy && c.userId == detail.currentUserId)
                ? () => onDeleteComment(c.id)
                : null,
          ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                key: const Key('detail_comment_field'),
                controller: commentController,
                minLines: 1,
                maxLines: 3,
                decoration: const InputDecoration(hintText: 'Add a comment…'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              key: const Key('detail_comment_send'),
              onPressed: busy ? null : onAddComment,
              icon: const Icon(Icons.send, color: kAccent),
            ),
          ],
        ),
      ],
    );
  }
}

class _ReactionBar extends StatelessWidget {
  const _ReactionBar({
    required this.counts,
    required this.mine,
    required this.busy,
    required this.onTap,
  });

  final Map<String, int> counts;
  final String? mine;
  final bool busy;
  final void Function(String type, String? current) onTap;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      children: [
        for (final entry in reactionEmojis.entries)
          _ReactionChip(
            key: Key('reaction_${entry.key}'),
            emoji: entry.value,
            count: counts[entry.key] ?? 0,
            selected: mine == entry.key,
            onTap: busy ? null : () => onTap(entry.key, mine),
          ),
      ],
    );
  }
}

class _ReactionChip extends StatelessWidget {
  const _ReactionChip({
    super.key,
    required this.emoji,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  final String emoji;
  final int count;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? kAccent.withValues(alpha: 0.18) : kSurface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? kAccent : Colors.transparent),
        ),
        child: Text('$emoji $count', style: const TextStyle(color: Colors.white, fontSize: 15)),
      ),
    );
  }
}

class _CommentTile extends StatelessWidget {
  const _CommentTile({required this.comment, required this.onDelete});

  final EntryComment comment;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  comment.authorName ?? 'Anonymous',
                  style: const TextStyle(color: kAccent, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(comment.content, style: const TextStyle(color: Colors.white)),
              ],
            ),
          ),
          if (onDelete != null)
            IconButton(
              visualDensity: VisualDensity.compact,
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline, size: 18, color: kMuted),
            ),
        ],
      ),
    );
  }
}
