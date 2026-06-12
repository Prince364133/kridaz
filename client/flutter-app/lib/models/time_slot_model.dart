import 'turf_model.dart';

double? _toDouble(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString());
}

class BookedTimeSlot {
  final String id;
  final DateTime startTime;
  final DateTime endTime;
  final double? price;

  BookedTimeSlot({
    required this.id,
    required this.startTime,
    required this.endTime,
    this.price,
  });

  factory BookedTimeSlot.fromJson(Map<String, dynamic> json) {
    return BookedTimeSlot(
      id: (json['id'] ?? json['_id'])?.toString() ?? '',
      startTime: DateTime.parse(json['startTime'].toString()),
      endTime: DateTime.parse(json['endTime'].toString()),
      price: _toDouble(json['price']),
    );
  }
}

class TurfTimeSlotResponse {
  final TurfModel timeSlots;
  final List<BookedTimeSlot> bookedTime;
  final String? message;

  TurfTimeSlotResponse({
    required this.timeSlots,
    required this.bookedTime,
    this.message,
  });

  factory TurfTimeSlotResponse.fromJson(Map<String, dynamic> json) {
    return TurfTimeSlotResponse(
      timeSlots: TurfModel.fromJson(json['timeSlots'] as Map<String, dynamic>),
      bookedTime: (json['bookedTime'] as List?)
              ?.map((e) => BookedTimeSlot.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      message: json['message']?.toString(),
    );
  }
}

/// Represents a displayable time slot on the booking screen
class DisplaySlot {
  final String startTime; // "HH:mm" format
  final String endTime; // "HH:mm" format
  final double price;
  final bool isBooked;
  final bool isActive;

  DisplaySlot({
    required this.startTime,
    required this.endTime,
    required this.price,
    this.isBooked = false,
    this.isActive = true,
  });
}
