import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/prompt_privacy.dart';
import '../models/entry_models.dart';
import 'content_filter.dart';

class EntryService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<EntryDetail> fetch(String entryId) async {
    final userId = _client.auth.currentUser?.id;

    final entry = await _client
        .from('entries')
        .select(
          'id, user_id, date_of_night, rating, prompts, created_at, video_url, visibility',
        )
        .eq('id', entryId)
        .maybeSingle();

    if (entry == null) {
      throw StateError('Entry not found or not visible.');
    }

    final authorId = entry['user_id'] as String;
    final prompts = (entry['prompts'] as Map?)?.cast<String, dynamic>() ?? {};
    final isMine = authorId == userId;

    final results = await Future.wait<dynamic>([
      _client
          .from('profiles')
          .select('display_name, username')
          .eq('id', authorId)
          .maybeSingle(),
      _client.from('photos').select('type, url').eq('entry_id', entryId),
      _client
          .from('timeline_steps')
          .select('type, location_name, time_at, notes, emoji, sort_order')
          .eq('entry_id', entryId)
          .order('sort_order', ascending: true),
      _client.from('reactions').select('user_id, type').eq('entry_id', entryId),
      _client
          .from('comments')
          .select('id, user_id, content, created_at')
          .eq('entry_id', entryId)
          .order('created_at', ascending: true),
      _client.from('entry_tags').select('user_id').eq('entry_id', entryId),
    ]);

    final author = results[0] as Map<String, dynamic>?;
    final photos = (results[1] as List).cast<Map<String, dynamic>>();
    final timelineRows = (results[2] as List).cast<Map<String, dynamic>>();
    final reactions = (results[3] as List).cast<Map<String, dynamic>>();
    final commentRows = (results[4] as List).cast<Map<String, dynamic>>();
    final tagRows = (results[5] as List).cast<Map<String, dynamic>>();

    final photoUrls = [
      for (final photo in photos)
        if (photo['type'] == 'favourite' || photo['type'] == 'outfit')
          photo['url'] as String,
    ];

    final timeline = [
      for (final step in timelineRows)
        TimelineStep(
          type: step['type'] as String,
          locationName: step['location_name'] as String?,
          timeAt: step['time_at'] as String?,
          notes: step['notes'] as String?,
          emoji: step['emoji'] as String?,
        ),
    ];

    final reactionCounts = <String, int>{};
    String? myReactionType;
    for (final reaction in reactions) {
      final type = reaction['type'] as String;
      reactionCounts[type] = (reactionCounts[type] ?? 0) + 1;
      if (reaction['user_id'] == userId) myReactionType = type;
    }

    final commenterIds = {
      for (final comment in commentRows) comment['user_id'] as String,
    }.toList();
    final nameById = <String, String?>{};
    if (commenterIds.isNotEmpty) {
      final profiles = await _client
          .from('profiles')
          .select('id, display_name, username')
          .inFilter('id', commenterIds);
      for (final profile in (profiles as List).cast<Map<String, dynamic>>()) {
        nameById[profile['id'] as String] = _profileName(profile);
      }
    }

    final comments = [
      for (final comment in commentRows)
        EntryComment(
          id: comment['id'] as String,
          userId: comment['user_id'] as String,
          content: comment['content'] as String,
          createdAt: comment['created_at'] as String,
          authorName: nameById[comment['user_id']],
        ),
    ];

    final taggedIds = [
      for (final tag in tagRows) tag['user_id'] as String,
    ];
    final taggedProfiles = await _taggedProfiles(taggedIds);

    return EntryDetail(
      id: entry['id'] as String,
      userId: authorId,
      dateOfNight: entry['date_of_night'] as String,
      rating: entry['rating'] as int?,
      prompts: _visiblePrompts(prompts, isMine),
      authorName: author == null ? null : _profileName(author),
      photoUrls: photoUrls,
      timeline: timeline,
      reactionCounts: reactionCounts,
      myReactionType: myReactionType,
      comments: comments,
      isMine: isMine,
      taggedProfiles: taggedProfiles,
      videoUrl: entry['video_url'] as String?,
      currentUserId: userId,
    );
  }

  Future<EntryEditData> fetchForEdit(String entryId) async {
    final userId = _client.auth.currentUser!.id;
    final entry = await _client
        .from('entries')
        .select(
          'id, user_id, date_of_night, rating, prompts, visibility, video_url',
        )
        .eq('id', entryId)
        .maybeSingle();

    if (entry == null || entry['user_id'] != userId) {
      throw StateError('Entry not found or not editable.');
    }

    final results = await Future.wait([
      _client.from('photos').select('type, url').eq('entry_id', entryId),
      _client
          .from('timeline_steps')
          .select('type, location_name, time_at, notes, emoji, sort_order')
          .eq('entry_id', entryId)
          .order('sort_order', ascending: true),
      _client.from('entry_tags').select('user_id').eq('entry_id', entryId),
    ]);

    final photos = (results[0] as List).cast<Map<String, dynamic>>();
    final timelineRows = (results[1] as List).cast<Map<String, dynamic>>();
    final tagRows = (results[2] as List).cast<Map<String, dynamic>>();

    String? outfitUrl;
    String? favouriteUrl;
    for (final photo in photos) {
      if (photo['type'] == 'outfit') outfitUrl = photo['url'] as String;
      if (photo['type'] == 'favourite') favouriteUrl = photo['url'] as String;
    }

    final timeline = [
      for (final step in timelineRows)
        EditableTimelineStep(
          type: step['type'] as String,
          emoji: step['emoji'] as String? ?? '🎉',
          locationName: step['location_name'] as String? ?? '',
          timeAt: _parseTime(step['time_at'] as String?),
          notes: step['notes'] as String? ?? '',
        ),
    ];

    return EntryEditData(
      id: entryId,
      date: DateTime.parse(entry['date_of_night'] as String),
      rating: entry['rating'] as int?,
      visibility: entry['visibility'] as String? ?? 'friends',
      prompts: (entry['prompts'] as Map?)?.cast<String, dynamic>() ?? {},
      outfitUrl: outfitUrl,
      favouriteUrl: favouriteUrl,
      videoUrl: entry['video_url'] as String?,
      timeline: timeline,
      taggedUserIds: [
        for (final tag in tagRows) tag['user_id'] as String,
      ],
    );
  }

  Future<String> createEntry({
    required DateTime date,
    required int rating,
    required String visibility,
    required Map<String, dynamic> prompts,
    PickedUpload? outfit,
    PickedUpload? favourite,
    String? videoUrl,
    List<EditableTimelineStep> timeline = const [],
    List<String> taggedUserIds = const [],
  }) async {
    assertEntryContentAllowed(
      prompts: prompts,
      timelineNotes: [for (final step in timeline) step.notes],
    );

    final userId = _client.auth.currentUser!.id;
    final entry = await _client
        .from('entries')
        .insert({
          'user_id': userId,
          'date_of_night': DateFormat('yyyy-MM-dd').format(date),
          'rating': rating,
          'prompts': prompts,
          'visibility': visibility,
          if (videoUrl != null) 'video_url': videoUrl,
        })
        .select('id')
        .single();

    final entryId = entry['id'] as String;
    await _saveRelated(
      entryId: entryId,
      outfit: outfit,
      favourite: favourite,
      timeline: timeline,
      taggedUserIds: taggedUserIds,
    );
    return entryId;
  }

  Future<void> updateEntry({
    required String entryId,
    required DateTime date,
    required int rating,
    required String visibility,
    required Map<String, dynamic> prompts,
    PickedUpload? outfit,
    PickedUpload? favourite,
    String? existingOutfitUrl,
    String? existingFavouriteUrl,
    String? videoUrl,
    List<EditableTimelineStep> timeline = const [],
    List<String> taggedUserIds = const [],
  }) async {
    assertEntryContentAllowed(
      prompts: prompts,
      timelineNotes: [for (final step in timeline) step.notes],
    );

    final userId = _client.auth.currentUser!.id;
    await _client
        .from('entries')
        .update({
          'date_of_night': DateFormat('yyyy-MM-dd').format(date),
          'rating': rating,
          'prompts': prompts,
          'visibility': visibility,
          'video_url': videoUrl,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', entryId)
        .eq('user_id', userId);

    await _client.from('timeline_steps').delete().eq('entry_id', entryId);
    await _client.from('photos').delete().eq('entry_id', entryId);
    await _client.from('entry_tags').delete().eq('entry_id', entryId);

    PickedUpload? outfitUpload = outfit;
    PickedUpload? favouriteUpload = favourite;
    if (outfitUpload == null && existingOutfitUrl != null) {
      outfitUpload = PickedUpload(path: '', url: existingOutfitUrl);
    }
    if (favouriteUpload == null && existingFavouriteUrl != null) {
      favouriteUpload = PickedUpload(path: '', url: existingFavouriteUrl);
    }

    await _saveRelated(
      entryId: entryId,
      outfit: outfitUpload,
      favourite: favouriteUpload,
      timeline: timeline,
      taggedUserIds: taggedUserIds,
    );
  }

  Future<void> deleteEntry(String entryId) async {
    final userId = _client.auth.currentUser!.id;
    await _client.from('entries').delete().eq('id', entryId).eq('user_id', userId);
  }

  Future<void> _saveRelated({
    required String entryId,
    PickedUpload? outfit,
    PickedUpload? favourite,
    required List<EditableTimelineStep> timeline,
    required List<String> taggedUserIds,
  }) async {
    final photoRows = [
      if (outfit != null)
        {'entry_id': entryId, 'type': 'outfit', 'url': outfit.url},
      if (favourite != null)
        {'entry_id': entryId, 'type': 'favourite', 'url': favourite.url},
    ];
    if (photoRows.isNotEmpty) {
      await _client.from('photos').insert(photoRows);
    }

    if (timeline.isNotEmpty) {
      await _client.from('timeline_steps').insert([
        for (var i = 0; i < timeline.length; i++)
          {
            'entry_id': entryId,
            'type': timeline[i].type,
            'emoji': timeline[i].emoji,
            'location_name': timeline[i].locationName.trim().isEmpty
                ? null
                : timeline[i].locationName.trim(),
            'time_at': timeline[i].timeAt == null
                ? null
                : _formatTime(timeline[i].timeAt!),
            'notes': timeline[i].notes.trim().isEmpty
                ? null
                : timeline[i].notes.trim(),
            'sort_order': i,
          },
      ]);
    }

    if (taggedUserIds.isNotEmpty) {
      await _client.from('entry_tags').insert([
        for (final taggedId in taggedUserIds)
          {'entry_id': entryId, 'user_id': taggedId},
      ]);
    }
  }

  Map<String, dynamic> _visiblePrompts(
    Map<String, dynamic> prompts,
    bool isMine,
  ) {
    final visible = <String, dynamic>{};
    for (final entry in prompts.entries) {
      final key = entry.key;
      final value = entry.value;
      if (isPromptMetadataKey(key)) continue;
      if (key == 'kissedWho') continue;
      if (value == null || value.toString().trim().isEmpty) continue;
      if (!isMine && isPromptPrivate(prompts, key)) continue;
      visible[key] = value;
    }
    return visible;
  }

  String? _profileName(Map<String, dynamic> profile) {
    final displayName = profile['display_name'] as String?;
    final username = profile['username'] as String?;
    if (displayName?.trim().isNotEmpty == true) return displayName!.trim();
    if (username?.trim().isNotEmpty == true) return '@$username';
    return null;
  }

  Future<List<TaggedProfile>> _taggedProfiles(List<String> ids) async {
    if (ids.isEmpty) return [];
    final rows = await _client
        .from('profiles')
        .select('id, display_name, username')
        .inFilter('id', ids);
    return [
      for (final row in rows as List)
        TaggedProfile(
          id: row['id'] as String,
          name: _profileName(row as Map<String, dynamic>) ?? 'Friend',
        ),
    ];
  }

  TimeOfDay? _parseTime(String? value) {
    if (value == null || value.isEmpty) return null;
    final parts = value.split(':');
    if (parts.length < 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    return TimeOfDay(hour: hour, minute: minute);
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute:00';
  }

  Future<void> toggleReaction({
    required String entryId,
    required String type,
    required String? currentType,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    if (currentType == type) {
      await _client
          .from('reactions')
          .delete()
          .eq('entry_id', entryId)
          .eq('user_id', userId);
    } else {
      await _client.from('reactions').upsert({
        'entry_id': entryId,
        'user_id': userId,
        'type': type,
      }, onConflict: 'entry_id,user_id');
    }
  }

  Future<void> addComment({
    required String entryId,
    required String content,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    assertContentAllowed(content);
    await _client.from('comments').insert({
      'entry_id': entryId,
      'user_id': userId,
      'content': content,
    });
  }

  Future<void> deleteComment(String commentId) async {
    await _client.from('comments').delete().eq('id', commentId);
  }
}

final entryService = EntryService();
