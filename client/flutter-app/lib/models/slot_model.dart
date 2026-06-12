enum SlotStatus { open, held, joined, pending }

class SlotData {
  final String role;
  final String? userId;
  final String? userName;
  final String? customPlayerName;
  final String? customPlayerEmail;
  final SlotStatus status;

  const SlotData({
    required this.role,
    this.userId,
    this.userName,
    this.customPlayerName,
    this.customPlayerEmail,
    this.status = SlotStatus.open,
  });

  SlotData copyWith({
    String? role,
    String? userId,
    String? userName,
    String? customPlayerName,
    String? customPlayerEmail,
    SlotStatus? status,
  }) {
    return SlotData(
      role: role ?? this.role,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      customPlayerName: customPlayerName ?? this.customPlayerName,
      customPlayerEmail: customPlayerEmail ?? this.customPlayerEmail,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      if (userId != null) 'user': userId,
      'status': status.name.toUpperCase(),
    };
  }
}

class TeamConfig {
  final String name;
  final String? imageUrl;
  final List<SlotData> slots;

  const TeamConfig({
    required this.name,
    this.imageUrl,
    required this.slots,
  });

  TeamConfig copyWith({
    String? name,
    String? imageUrl,
    List<SlotData>? slots,
  }) {
    return TeamConfig(
      name: name ?? this.name,
      imageUrl: imageUrl ?? this.imageUrl,
      slots: slots ?? this.slots,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (imageUrl != null) 'image': imageUrl,
      'slots': slots.map((s) => s.toJson()).toList(),
    };
  }
}
