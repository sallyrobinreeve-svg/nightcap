import 'package:flutter/material.dart';

import '../data/timeline.dart';
import '../models/entry_models.dart';
import '../theme.dart';

class TimelineEditor extends StatelessWidget {
  const TimelineEditor({
    required this.steps,
    required this.onChanged,
    super.key,
  });

  final List<EditableTimelineStep> steps;
  final VoidCallback onChanged;

  void _addStep() {
    steps.add(EditableTimelineStep());
    onChanged();
  }

  void _removeStep(int index) {
    steps.removeAt(index);
    onChanged();
  }

  void _moveStep(int oldIndex, int newIndex) {
    if (newIndex > oldIndex) newIndex -= 1;
    final step = steps.removeAt(oldIndex);
    steps.insert(newIndex, step);
    onChanged();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Night timeline', style: TextStyle(fontWeight: FontWeight.bold)),
            const Spacer(),
            TextButton.icon(
              onPressed: _addStep,
              icon: const Icon(Icons.add),
              label: const Text('Add stop'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (steps.isEmpty)
          const Text(
            'Add stops like Pres → Club → Bar to map your night.',
            style: TextStyle(color: NightColors.muted),
          )
        else
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: steps.length,
            onReorder: _moveStep,
            itemBuilder: (context, index) {
              final step = steps[index];
              return _TimelineStepCard(
                key: ValueKey(step.localId),
                step: step,
                onChanged: onChanged,
                onRemove: () => _removeStep(index),
              );
            },
          ),
      ],
    );
  }
}

class _TimelineStepCard extends StatefulWidget {
  const _TimelineStepCard({
    required super.key,
    required this.step,
    required this.onChanged,
    required this.onRemove,
  });

  final EditableTimelineStep step;
  final VoidCallback onChanged;
  final VoidCallback onRemove;

  @override
  State<_TimelineStepCard> createState() => _TimelineStepCardState();
}

class _TimelineStepCardState extends State<_TimelineStepCard> {
  late final TextEditingController _location;
  late final TextEditingController _notes;

  @override
  void initState() {
    super.initState();
    _location = TextEditingController(text: widget.step.locationName);
    _notes = TextEditingController(text: widget.step.notes);
  }

  @override
  void dispose() {
    _location.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final step = widget.step;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: NightColors.background.withValues(alpha: 0.5),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.drag_handle, color: NightColors.muted),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: step.type,
                    decoration: const InputDecoration(labelText: 'Stop type'),
                    items: [
                      for (final type in timelineStepTypes)
                        DropdownMenuItem(
                          value: type,
                          child: Text(timelineTypeLabel(type)),
                        ),
                    ],
                    onChanged: (value) {
                      if (value == null) return;
                      step.type = value;
                      widget.onChanged();
                    },
                  ),
                ),
                IconButton(
                  onPressed: widget.onRemove,
                  icon: const Icon(Icons.delete_outline, color: NightColors.muted),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              children: [
                for (final emoji in timelineEmojis)
                  ChoiceChip(
                    label: Text(emoji, style: const TextStyle(fontSize: 18)),
                    selected: step.emoji == emoji,
                    onSelected: (_) {
                      step.emoji = emoji;
                      widget.onChanged();
                    },
                  ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(labelText: 'Location'),
              controller: _location,
              onChanged: (value) {
                step.locationName = value;
                widget.onChanged();
              },
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Time'),
              subtitle: Text(
                step.timeAt == null
                    ? 'Not set'
                    : step.timeAt!.format(context),
              ),
              trailing: const Icon(Icons.schedule),
              onTap: () async {
                final picked = await showTimePicker(
                  context: context,
                  initialTime: step.timeAt ?? TimeOfDay.now(),
                );
                if (picked != null) {
                  step.timeAt = picked;
                  widget.onChanged();
                  setState(() {});
                }
              },
            ),
            TextField(
              decoration: const InputDecoration(labelText: 'Notes'),
              maxLines: 2,
              controller: _notes,
              onChanged: (value) {
                step.notes = value;
                widget.onChanged();
              },
            ),
          ],
        ),
      ),
    );
  }
}
