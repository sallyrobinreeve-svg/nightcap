import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/entry_models.dart';

SupabaseClient get _client => Supabase.instance.client;

Future<PickedUpload> uploadPickedFile(XFile file, String type) async {
  final userId = _client.auth.currentUser!.id;
  final bytes = await file.readAsBytes();
  final ext = file.name.split('.').lastOrNull ?? 'jpg';
  final path = '$userId/${DateTime.now().millisecondsSinceEpoch}-$type.$ext';
  await _client.storage
      .from('photos')
      .uploadBinary(
        path,
        bytes,
        fileOptions: FileOptions(contentType: file.mimeType ?? 'image/jpeg'),
      );
  return PickedUpload(
    path: path,
    url: _client.storage.from('photos').getPublicUrl(path),
  );
}

Future<PickedUpload> uploadVideoFile(XFile file) async {
  final userId = _client.auth.currentUser!.id;
  final bytes = await file.readAsBytes();
  final ext = file.name.split('.').lastOrNull ?? 'mp4';
  final path = '$userId/${DateTime.now().millisecondsSinceEpoch}-video.$ext';
  await _client.storage
      .from('photos')
      .uploadBinary(
        path,
        bytes,
        fileOptions: FileOptions(contentType: file.mimeType ?? 'video/mp4'),
      );
  return PickedUpload(
    path: path,
    url: _client.storage.from('photos').getPublicUrl(path),
  );
}
