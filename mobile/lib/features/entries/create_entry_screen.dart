import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../supabase_providers.dart';
import '../../theme.dart';

class CreateEntryScreen extends ConsumerStatefulWidget {
  const CreateEntryScreen({super.key});

  @override
  ConsumerState<CreateEntryScreen> createState() => _CreateEntryScreenState();
}

class _CreateEntryScreenState extends ConsumerState<CreateEntryScreen> {
  DateTime _date = DateTime.now();
  int _rating = 4;
  String _visibility = 'public';
  final _drunkest = TextEditingController();
  final _funniest = TextEditingController();
  final _mission = TextEditingController();
  bool _saving = false;
  String? _error;

  static const _visibilities = {
    'private': 'Only me',
    'friends': 'Friends only',
    'public': 'Public',
  };

  @override
  void dispose() {
    _drunkest.dispose();
    _funniest.dispose();
    _mission.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2015),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final client = ref.read(supabaseProvider);
      final user = client.auth.currentUser;
      if (user == null) throw StateError('Not signed in');

      final prompts = <String, dynamic>{
        if (_drunkest.text.trim().isNotEmpty) 'drunkest': _drunkest.text.trim(),
        if (_funniest.text.trim().isNotEmpty) 'funniest': _funniest.text.trim(),
        if (_mission.text.trim().isNotEmpty) 'mission': _mission.text.trim(),
      };

      await client.from('entries').insert({
        'user_id': user.id,
        'date_of_night': DateFormat('yyyy-MM-dd').format(_date),
        'rating': _rating,
        'prompts': prompts,
        'visibility': _visibility,
      });

      if (mounted) context.pop(true);
    } catch (_) {
      setState(() => _error = 'Could not save your recap. Please try again.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New recap')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _label('Date of night'),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              key: const Key('create_date'),
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_today, size: 18, color: kAccent),
              label: Text(
                DateFormat('EEEE, MMM d, yyyy').format(_date),
                style: const TextStyle(color: Colors.white),
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                side: const BorderSide(color: kSurface),
              ),
            ),
            const SizedBox(height: 24),
            _label('Rating'),
            const SizedBox(height: 8),
            Row(
              children: [
                for (var i = 1; i <= 5; i++)
                  IconButton(
                    key: Key('create_star_$i'),
                    onPressed: () => setState(() => _rating = i),
                    icon: Icon(
                      i <= _rating ? Icons.star : Icons.star_border,
                      color: kAccent,
                      size: 34,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            _label('Prompts'),
            const SizedBox(height: 8),
            TextField(
              key: const Key('create_drunkest'),
              controller: _drunkest,
              decoration: const InputDecoration(hintText: 'Who was drunkest?'),
            ),
            const SizedBox(height: 12),
            TextField(
              key: const Key('create_funniest'),
              controller: _funniest,
              decoration: const InputDecoration(hintText: 'Funniest moment'),
            ),
            const SizedBox(height: 12),
            TextField(
              key: const Key('create_mission'),
              controller: _mission,
              decoration: const InputDecoration(hintText: 'Mission of the night'),
            ),
            const SizedBox(height: 24),
            _label('Visibility'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              key: const Key('create_visibility'),
              initialValue: _visibility,
              dropdownColor: kSurface,
              items: [
                for (final entry in _visibilities.entries)
                  DropdownMenuItem(value: entry.key, child: Text(entry.value)),
              ],
              onChanged: (v) => setState(() => _visibility = v ?? 'public'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            const SizedBox(height: 28),
            ElevatedButton(
              key: const Key('create_submit'),
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Post recap'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
      );
}
