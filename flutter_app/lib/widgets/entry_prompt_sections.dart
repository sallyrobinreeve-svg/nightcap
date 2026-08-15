import 'package:flutter/material.dart';

import '../data/prompt_privacy.dart';
import '../data/prompts.dart';
import '../theme.dart';

class MissionPromptSection extends StatefulWidget {
  const MissionPromptSection({
    required this.promptValues,
    required this.onChanged,
    super.key,
  });

  final Map<String, dynamic> promptValues;
  final VoidCallback onChanged;

  @override
  State<MissionPromptSection> createState() => _MissionPromptSectionState();
}

class _MissionPromptSectionState extends State<MissionPromptSection> {
  late final TextEditingController _missionController;

  bool get hasMission => hasMissionValue(widget.promptValues['hasMission']);
  bool get missionCompleted => widget.promptValues['missionCompleted'] == true;

  @override
  void initState() {
    super.initState();
    _missionController = TextEditingController(
      text: widget.promptValues['tonightsObjective']?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _missionController.dispose();
    super.dispose();
  }

  void _setHasMission(bool value) {
    widget.promptValues['hasMission'] = value;
    if (!value) {
      widget.promptValues.remove('tonightsObjective');
      widget.promptValues.remove('missionCompleted');
      widget.promptValues.remove('tonightsObjectivePrivate');
      _missionController.clear();
    }
    widget.onChanged();
    setState(() {});
  }

  void _setMissionCompleted(bool value) {
    widget.promptValues['missionCompleted'] = value;
    widget.onChanged();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Mission', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Was there a mission?', style: TextStyle(color: NightColors.muted)),
        const SizedBox(height: 6),
        SegmentedButton<bool>(
          segments: const [
            ButtonSegment(value: true, label: Text('Yes')),
            ButtonSegment(value: false, label: Text('No')),
          ],
          selected: {hasMission},
          onSelectionChanged: (selection) => _setHasMission(selection.first),
        ),
        if (hasMission) ...[
          const SizedBox(height: 14),
          const Text('What was it?', style: TextStyle(color: NightColors.muted)),
          const SizedBox(height: 6),
          TextField(
            controller: _missionController,
            decoration: nightInputDecoration('Mission of the night'),
            onChanged: (value) {
              if (value.trim().isEmpty) {
                widget.promptValues.remove('tonightsObjective');
              } else {
                widget.promptValues['tonightsObjective'] = value;
              }
              widget.onChanged();
            },
          ),
          const SizedBox(height: 14),
          const Text('Was it completed?', style: TextStyle(color: NightColors.muted)),
          const SizedBox(height: 6),
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: true, label: Text('Yes')),
              ButtonSegment(value: false, label: Text('No')),
            ],
            selected: {missionCompleted},
            onSelectionChanged: (selection) =>
                _setMissionCompleted(selection.first),
          ),
          const SizedBox(height: 8),
          _SectionPrivacyToggle(
            label: 'Keep mission private',
            value: isPromptPrivate(widget.promptValues, 'tonightsObjective'),
            onChanged: (value) {
              if (value) {
                widget.promptValues[privacyKeyFor('tonightsObjective')] = true;
              } else {
                widget.promptValues.remove('tonightsObjectivePrivate');
              }
              widget.onChanged();
              setState(() {});
            },
          ),
        ],
      ],
    );
  }
}

class KissPromptSection extends StatefulWidget {
  const KissPromptSection({
    required this.promptValues,
    required this.onChanged,
    super.key,
  });

  final Map<String, dynamic> promptValues;
  final VoidCallback onChanged;

  @override
  State<KissPromptSection> createState() => _KissPromptSectionState();
}

class _KissPromptSectionState extends State<KissPromptSection> {
  late final TextEditingController _whoController;

  bool get kissed => kissedAnyoneValue(widget.promptValues['kissedAnyone']);

  @override
  void initState() {
    super.initState();
    _whoController = TextEditingController(
      text: widget.promptValues['kissedWho']?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _whoController.dispose();
    super.dispose();
  }

  void _setKissed(bool value) {
    widget.promptValues['kissedAnyone'] = value;
    if (!value) {
      widget.promptValues.remove('kissedWho');
      widget.promptValues.remove('kissedPrivate');
      _whoController.clear();
    } else {
      widget.promptValues['kissedPrivate'] =
          widget.promptValues['kissedPrivate'] ?? true;
    }
    widget.onChanged();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Did you kiss anyone?',
          style: TextStyle(color: NightColors.muted),
        ),
        const SizedBox(height: 6),
        SegmentedButton<bool>(
          segments: const [
            ButtonSegment(value: true, label: Text('Yes')),
            ButtonSegment(value: false, label: Text('No')),
          ],
          selected: {kissed},
          onSelectionChanged: (selection) => _setKissed(selection.first),
        ),
        if (kissed) ...[
          const SizedBox(height: 14),
          TextField(
            controller: _whoController,
            decoration: nightInputDecoration('Who? (optional)'),
            onChanged: (value) {
              if (value.trim().isEmpty) {
                widget.promptValues.remove('kissedWho');
              } else {
                widget.promptValues['kissedWho'] = value;
              }
              widget.onChanged();
            },
          ),
          const SizedBox(height: 8),
          _SectionPrivacyToggle(
            label: 'Keep this private',
            value: isPromptPrivate(widget.promptValues, 'kissedAnyone'),
            onChanged: (value) {
              if (value) {
                widget.promptValues['kissedPrivate'] = true;
              } else {
                widget.promptValues.remove('kissedPrivate');
              }
              widget.onChanged();
              setState(() {});
            },
          ),
        ],
      ],
    );
  }
}

class PromptFieldWithPrivacy extends StatefulWidget {
  const PromptFieldWithPrivacy({
    required this.prompt,
    required this.promptValues,
    required this.onChanged,
    super.key,
  });

  final PromptDefinition prompt;
  final Map<String, dynamic> promptValues;
  final VoidCallback onChanged;

  @override
  State<PromptFieldWithPrivacy> createState() => _PromptFieldWithPrivacyState();
}

class _PromptFieldWithPrivacyState extends State<PromptFieldWithPrivacy> {
  late final TextEditingController _textController;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(
      text: widget.promptValues[widget.prompt.id]?.toString() ?? '',
    );
  }

  @override
  void didUpdateWidget(covariant PromptFieldWithPrivacy oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = widget.promptValues[widget.prompt.id]?.toString() ?? '';
    if (next != _textController.text) {
      _textController.text = next;
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _setValue(dynamic value) {
    if (value == null || (value is String && value.trim().isEmpty)) {
      widget.promptValues.remove(widget.prompt.id);
      widget.promptValues.remove(privacyKeyFor(widget.prompt.id));
    } else {
      widget.promptValues[widget.prompt.id] = value;
    }
    widget.onChanged();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final prompt = widget.prompt;
    final value = widget.promptValues[prompt.id];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(prompt.label, style: const TextStyle(color: NightColors.muted)),
        const SizedBox(height: 6),
        switch (prompt.inputType) {
          PromptInputType.textarea => TextField(
            controller: _textController,
            maxLines: 3,
            decoration: nightInputDecoration(prompt.placeholder ?? 'Your answer'),
            onChanged: _setValue,
          ),
          PromptInputType.slider => Slider(
            value: (value as num?)?.toDouble() ?? prompt.sliderMin.toDouble(),
            min: prompt.sliderMin.toDouble(),
            max: prompt.sliderMax.toDouble(),
            divisions: prompt.sliderMax - prompt.sliderMin,
            label: '${value ?? prompt.sliderMin}',
            onChanged: _setValue,
          ),
          PromptInputType.toggle => SegmentedButton<String>(
            segments: [
              ButtonSegment(
                value: prompt.toggleLabels[0],
                label: Text(prompt.toggleLabels[0]),
              ),
              ButtonSegment(
                value: prompt.toggleLabels[1],
                label: Text(prompt.toggleLabels[1]),
              ),
            ],
            selected: {value?.toString() ?? prompt.toggleLabels[1]},
            onSelectionChanged: (selection) => _setValue(selection.first),
          ),
          PromptInputType.choices => Wrap(
            spacing: 8,
            children: [
              for (final choice in prompt.choices)
                ChoiceChip(
                  label: Text(choice),
                  selected: value == choice,
                  onSelected: (_) => _setValue(choice),
                ),
            ],
          ),
          PromptInputType.text => TextField(
            controller: _textController,
            decoration: nightInputDecoration(prompt.placeholder ?? 'Your answer'),
            onChanged: _setValue,
          ),
        },
        if (prompt.canBePrivate &&
            value != null &&
            value.toString().trim().isNotEmpty) ...[
          const SizedBox(height: 6),
          _SectionPrivacyToggle(
            label: 'Keep this private',
            value: isPromptPrivate(widget.promptValues, prompt.id),
            onChanged: (checked) {
              if (checked) {
                widget.promptValues[privacyKeyFor(prompt.id)] = true;
              } else {
                widget.promptValues.remove(privacyKeyFor(prompt.id));
              }
              widget.onChanged();
              setState(() {});
            },
          ),
        ],
      ],
    );
  }
}

class _SectionPrivacyToggle extends StatelessWidget {
  const _SectionPrivacyToggle({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      contentPadding: EdgeInsets.zero,
      value: value,
      onChanged: (checked) => onChanged(checked ?? false),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      controlAffinity: ListTileControlAffinity.leading,
    );
  }
}
