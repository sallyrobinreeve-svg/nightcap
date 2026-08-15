import 'package:flutter/material.dart';

import '../services/moderation_service.dart';
import '../theme.dart';

class ReportBlockMenu extends StatelessWidget {
  const ReportBlockMenu({
    required this.reportedUserId,
    this.entryId,
    this.commentId,
    this.onChanged,
    super.key,
  });

  final String reportedUserId;
  final String? entryId;
  final String? commentId;
  final VoidCallback? onChanged;

  Future<void> _report(BuildContext context) async {
    final reason = await showDialog<String>(
      context: context,
      builder: (context) => const _ReportDialog(),
    );
    if (reason == null || !context.mounted) return;
    try {
      await moderationService.report(
        reportedUserId: reportedUserId,
        entryId: entryId,
        commentId: commentId,
        reason: reason,
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Report submitted. We review within 24 hours.')),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not submit report.')),
        );
      }
    }
  }

  Future<void> _block(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Block user?'),
        content: const Text(
          'You will no longer see their posts. They cannot interact with you.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Block'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    try {
      await moderationService.block(reportedUserId);
      onChanged?.call();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User blocked.')),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not block user.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert, color: NightColors.muted),
      onSelected: (value) {
        if (value == 'report') _report(context);
        if (value == 'block') _block(context);
      },
      itemBuilder: (context) => const [
        PopupMenuItem(value: 'report', child: Text('Report')),
        PopupMenuItem(value: 'block', child: Text('Block user')),
      ],
    );
  }
}

class _ReportDialog extends StatefulWidget {
  const _ReportDialog();

  @override
  State<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<_ReportDialog> {
  final reason = TextEditingController();

  @override
  void dispose() {
    reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Report content'),
      content: TextField(
        controller: reason,
        maxLines: 3,
        decoration: const InputDecoration(
          hintText: 'Why are you reporting this?',
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, reason.text.trim()),
          child: const Text('Submit'),
        ),
      ],
    );
  }
}

class ReactionBar extends StatelessWidget {
  const ReactionBar({
    required this.counts,
    required this.myType,
    required this.onToggle,
    this.busy = false,
    super.key,
  });

  final Map<String, int> counts;
  final String? myType;
  final void Function(String type) onToggle;
  final bool busy;

  static const reactions = {
    'fire': '🔥',
    'heart': '❤️',
    'laugh': '😂',
    'wild': '🤪',
  };

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final entry in reactions.entries)
          FilterChip(
            selected: myType == entry.key,
            onSelected: busy ? null : (_) => onToggle(entry.key),
            label: Text('${entry.value} ${counts[entry.key] ?? 0}'),
            selectedColor: NightColors.accent.withValues(alpha: 0.35),
          ),
      ],
    );
  }
}
