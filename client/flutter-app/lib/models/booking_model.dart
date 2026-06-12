import 'court_model.dart';

enum BookingStatus {
  pending,
  confirmed,
  cancelled,
  completed;

  String get displayName {
    switch (this) {
      case BookingStatus.pending:
        return 'Pending';
      case BookingStatus.confirmed:
        return 'Confirmed';
      case BookingStatus.cancelled:
        return 'Cancelled';
      case BookingStatus.completed:
        return 'Completed';
    }
  }

  static BookingStatus fromString(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return BookingStatus.pending;
      case 'CONFIRMED':
        return BookingStatus.confirmed;
      case 'CANCELLED':
        return BookingStatus.cancelled;
      case 'COMPLETED':
        return BookingStatus.completed;
      default:
        return BookingStatus.pending;
    }
  }
}

class Booking {
  final String id;
  final String userId;
  final String courtId;
  final DateTime startTime;
  final DateTime endTime;
  final double totalPrice;
  final BookingStatus status;
  final String? paymentStatus;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Optional nested objects for denormalized API responses
  final Court? court;

  const Booking({
    required this.id,
    required this.userId,
    required this.courtId,
    required this.startTime,
    required this.endTime,
    required this.totalPrice,
    required this.status,
    this.paymentStatus,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.court,
  });

  // Helper getters for backward compatibility with UI
  String get groundName => court?.venue?.name ?? '';
  String get courtName => court?.name ?? '';
  String get imageUrl => court?.venue?.imageUrl ?? '';
  bool get confirmed => status == BookingStatus.confirmed;

  // Helper methods
  Duration get duration => endTime.difference(startTime);

  String get formattedTime {
    final startHour = startTime.hour;
    final startMinute = startTime.minute.toString().padLeft(2, '0');
    final startPeriod = startHour >= 12 ? 'PM' : 'AM';
    final startHour12 =
        startHour > 12 ? startHour - 12 : (startHour == 0 ? 12 : startHour);

    final endHour = endTime.hour;
    final endMinute = endTime.minute.toString().padLeft(2, '0');
    final endPeriod = endHour >= 12 ? 'PM' : 'AM';
    final endHour12 =
        endHour > 12 ? endHour - 12 : (endHour == 0 ? 12 : endHour);

    return '$startHour12:$startMinute $startPeriod - $endHour12:$endMinute $endPeriod';
  }

  String get durationText {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    if (minutes == 0) {
      return '$hours ${hours == 1 ? 'hour' : 'hours'}';
    }
    return '$hours ${hours == 1 ? 'hour' : 'hours'} $minutes min';
  }

  // For PostgreSQL - from JSON response
  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      courtId:
          json['court_id']?.toString() ?? json['courtId']?.toString() ?? '',
      startTime: json['start_time'] != null
          ? DateTime.parse(json['start_time'])
          : json['startTime'] != null
              ? DateTime.parse(json['startTime'])
              : DateTime.now(),
      endTime: json['end_time'] != null
          ? DateTime.parse(json['end_time'])
          : json['endTime'] != null
              ? DateTime.parse(json['endTime'])
              : DateTime.now(),
      totalPrice: (json['total_price'] ?? json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] is String
          ? BookingStatus.fromString(json['status'])
          : BookingStatus.pending,
      paymentStatus: json['payment_status']?.toString() ??
          json['paymentStatus']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'])
              : DateTime.now(),
      court: json['court'] != null ? Court.fromJson(json['court']) : null,
    );
  }

  // For PostgreSQL - to JSON for API requests
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'court_id': courtId,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'total_price': totalPrice,
      'status': status.name.toUpperCase(),
      'payment_status': paymentStatus,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Booking copyWith({
    String? id,
    String? userId,
    String? courtId,
    DateTime? startTime,
    DateTime? endTime,
    double? totalPrice,
    BookingStatus? status,
    String? paymentStatus,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    Court? court,
  }) {
    return Booking(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      courtId: courtId ?? this.courtId,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      totalPrice: totalPrice ?? this.totalPrice,
      status: status ?? this.status,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      court: court ?? this.court,
    );
  }
}
