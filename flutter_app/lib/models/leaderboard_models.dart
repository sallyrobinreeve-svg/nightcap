class LeaderboardEntry {
  const LeaderboardEntry({
    required this.userId,
    required this.displayName,
    this.avatarUrl,
    required this.isMe,
    required this.totalEntries,
    this.avgRating,
    required this.kissCount,
    required this.missionsCompleted,
    required this.topClubVisits,
  });

  final String userId;
  final String displayName;
  final String? avatarUrl;
  final bool isMe;
  final int totalEntries;
  final double? avgRating;
  final int kissCount;
  final int missionsCompleted;
  final int topClubVisits;
}

enum LeaderboardSort {
  entries,
  rating,
  missions,
  kisses,
  clubVisits,
}

extension LeaderboardSortLabel on LeaderboardSort {
  String get title => switch (this) {
    LeaderboardSort.entries => 'Most entries',
    LeaderboardSort.rating => 'Highest avg rating',
    LeaderboardSort.missions => 'Missions completed',
    LeaderboardSort.kisses => 'Kiss count',
    LeaderboardSort.clubVisits => 'Top club visits',
  };

  String formatValue(LeaderboardEntry entry) => switch (this) {
    LeaderboardSort.entries =>
      '${entry.totalEntries} ${entry.totalEntries == 1 ? 'entry' : 'entries'}',
    LeaderboardSort.rating =>
      entry.avgRating == null ? '—' : '${entry.avgRating!.toStringAsFixed(1)} / 5',
    LeaderboardSort.missions =>
      '${entry.missionsCompleted} ${entry.missionsCompleted == 1 ? 'mission' : 'missions'}',
    LeaderboardSort.kisses => '${entry.kissCount} kisses',
    LeaderboardSort.clubVisits => '${entry.topClubVisits} club visits',
  };

  double sortValue(LeaderboardEntry entry) => switch (this) {
    LeaderboardSort.entries => entry.totalEntries.toDouble(),
    LeaderboardSort.rating => entry.avgRating ?? -1,
    LeaderboardSort.missions => entry.missionsCompleted.toDouble(),
    LeaderboardSort.kisses => entry.kissCount.toDouble(),
    LeaderboardSort.clubVisits => entry.topClubVisits.toDouble(),
  };
}
