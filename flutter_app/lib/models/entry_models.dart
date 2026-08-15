import 'package:flutter/material.dart';

class EntryComment {
  const EntryComment({
    required this.id,
    required this.userId,
    required this.content,
    required this.createdAt,
    this.authorName,
  });

  final String id;
  final String userId;
  final String content;
  final String createdAt;
  final String? authorName;
}

class TimelineStep {
  const TimelineStep({
    required this.type,
    this.locationName,
    this.timeAt,
    this.notes,
    this.emoji,
  });

  final String type;
  final String? locationName;
  final String? timeAt;
  final String? notes;
  final String? emoji;
}

class EditableTimelineStep {
  EditableTimelineStep({
    String? localId,
    this.type = 'club',
    this.emoji = '🎉',
    this.locationName = '',
    this.timeAt,
    this.notes = '',
  }) : localId = localId ?? DateTime.now().microsecondsSinceEpoch.toString();

  final String localId;
  String type;
  String emoji;
  String locationName;
  TimeOfDay? timeAt;
  String notes;
}

class TaggedProfile {
  const TaggedProfile({required this.id, required this.name});
  final String id;
  final String name;
}

class EntryEditData {
  const EntryEditData({
    required this.id,
    required this.date,
    required this.rating,
    required this.visibility,
    required this.prompts,
    this.outfitUrl,
    this.favouriteUrl,
    this.videoUrl,
    required this.timeline,
    required this.taggedUserIds,
  });

  final String id;
  final DateTime date;
  final int? rating;
  final String visibility;
  final Map<String, dynamic> prompts;
  final String? outfitUrl;
  final String? favouriteUrl;
  final String? videoUrl;
  final List<EditableTimelineStep> timeline;
  final List<String> taggedUserIds;
}

class EntryDetail {
  const EntryDetail({
    required this.id,
    required this.userId,
    required this.dateOfNight,
    required this.rating,
    required this.prompts,
    required this.authorName,
    required this.photoUrls,
    required this.timeline,
    required this.reactionCounts,
    required this.myReactionType,
    required this.comments,
    required this.isMine,
    required this.taggedProfiles,
    this.videoUrl,
    this.currentUserId,
  });

  final String id;
  final String userId;
  final String dateOfNight;
  final int? rating;
  final Map<String, dynamic> prompts;
  final String? authorName;
  final List<String> photoUrls;
  final List<TimelineStep> timeline;
  final Map<String, int> reactionCounts;
  final String? myReactionType;
  final List<EntryComment> comments;
  final bool isMine;
  final List<TaggedProfile> taggedProfiles;
  final String? videoUrl;
  final String? currentUserId;
}

class PickedUpload {
  const PickedUpload({required this.path, required this.url});
  final String path;
  final String url;
}
