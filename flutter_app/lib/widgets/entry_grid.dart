import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../screens/entry_detail_screen.dart';
import '../services/user_entries_service.dart';
import '../theme.dart';

class EntryGrid extends StatelessWidget {
  const EntryGrid({
    required this.entries,
    this.crossAxisCount = 3,
    this.shrinkWrap = true,
    this.physics,
    super.key,
  });

  final List<UserEntryTile> entries;
  final int crossAxisCount;
  final bool shrinkWrap;
  final ScrollPhysics? physics;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return const SizedBox.shrink();
    }

    return GridView.builder(
      shrinkWrap: shrinkWrap,
      physics: physics ?? (shrinkWrap ? const NeverScrollableScrollPhysics() : null),
      itemCount: entries.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
      ),
      itemBuilder: (context, index) {
        final entry = entries[index];
        final date = DateTime.tryParse(entry.dateOfNight);
        return GestureDetector(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => EntryDetailScreen(entryId: entry.id),
              ),
            );
          },
          child: ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (entry.photoUrl != null)
                  Image.network(entry.photoUrl!, fit: BoxFit.cover)
                else
                  Container(
                    color: NightColors.card,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${entry.rating ?? '–'}',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (date != null)
                          Text(
                            DateFormat.MMMd().format(date),
                            style: const TextStyle(
                              color: NightColors.muted,
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                  ),
                if (entry.photoUrl != null)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.75),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      child: Text(
                        date == null
                            ? entry.dateOfNight
                            : DateFormat.MMMd().format(date),
                        style: const TextStyle(fontSize: 10),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
