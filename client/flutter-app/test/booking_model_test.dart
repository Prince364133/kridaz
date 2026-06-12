import 'package:flutter_test/flutter_test.dart';
import 'package:kridaz/models/booking_model.dart';
import 'package:kridaz/models/court_model.dart';
import 'package:kridaz/models/venue_model.dart';

void main() {
  group('BookingStatus', () {
    test('displayName returns correct labels', () {
      expect(BookingStatus.pending.displayName, 'Pending');
      expect(BookingStatus.confirmed.displayName, 'Confirmed');
      expect(BookingStatus.cancelled.displayName, 'Cancelled');
      expect(BookingStatus.completed.displayName, 'Completed');
    });

    test('fromString parses uppercase strings correctly', () {
      expect(BookingStatus.fromString('PENDING'), BookingStatus.pending);
      expect(BookingStatus.fromString('CONFIRMED'), BookingStatus.confirmed);
      expect(BookingStatus.fromString('CANCELLED'), BookingStatus.cancelled);
      expect(BookingStatus.fromString('COMPLETED'), BookingStatus.completed);
    });

    test('fromString handles mixed case', () {
      expect(BookingStatus.fromString('pending'), BookingStatus.pending);
      expect(BookingStatus.fromString('Confirmed'), BookingStatus.confirmed);
    });

    test('fromString returns pending for unknown status', () {
      expect(BookingStatus.fromString('unknown'), BookingStatus.pending);
    });
  });

  group('Booking', () {
    final now = DateTime.now();
    final startTime = now.add(const Duration(hours: 2));
    final endTime = startTime.add(const Duration(hours: 1));

    final booking = Booking(
      id: 'booking-123',
      userId: 'user-456',
      courtId: 'court-789',
      startTime: startTime,
      endTime: endTime,
      totalPrice: 1500.0,
      status: BookingStatus.confirmed,
      paymentStatus: 'paid',
      notes: 'Test booking',
      createdAt: now,
      updatedAt: now,
    );

    test('duration calculates correctly', () {
      expect(booking.duration, const Duration(hours: 1));
    });

    test('formattedTime returns correct format', () {
      final formatted = booking.formattedTime;
      expect(formatted, isNotEmpty);
      expect(formatted, contains('-'));
    });

    test('durationText shows hours correctly', () {
      expect(booking.durationText, '1 hour');
    });

    test('durationText shows hours and minutes', () {
      final bookingWithMinutes = booking.copyWith(
        endTime: startTime.add(const Duration(hours: 1, minutes: 30)),
      );
      expect(bookingWithMinutes.durationText, '1 hour 30 min');
    });

    test('confirmed getter returns true for confirmed status', () {
      expect(booking.confirmed, isTrue);
    });

    test('confirmed getter returns false for pending status', () {
      final pendingBooking = booking.copyWith(status: BookingStatus.pending);
      expect(pendingBooking.confirmed, isFalse);
    });

    test('groundName returns empty when court is null', () {
      expect(booking.groundName, '');
    });

    test('courtName returns empty when court is null', () {
      expect(booking.courtName, '');
    });

    test('imageUrl returns empty when court is null', () {
      expect(booking.imageUrl, '');
    });

    test('groundName, courtName, imageUrl return values when court is present',
        () {
      final venue = Venue(
        id: 'venue-1',
        name: 'Test Venue',
        location: 'Test Location',
        description: 'Test',
        imageUrl: 'https://example.com/venue.jpg',
        createdAt: now,
        updatedAt: now,
      );
      final court = Court(
        id: 'court-1',
        venueId: 'venue-1',
        name: 'Court A',
        createdAt: now,
        updatedAt: now,
        venue: venue,
      );
      final bookingWithCourt = booking.copyWith(court: court);

      expect(bookingWithCourt.groundName, 'Test Venue');
      expect(bookingWithCourt.courtName, 'Court A');
      expect(bookingWithCourt.imageUrl, 'https://example.com/venue.jpg');
    });
  });

  group('Booking.fromJson', () {
    test('parses PostgreSQL-style snake_case JSON', () {
      final now = DateTime.now();
      final json = {
        'id': 'booking-1',
        'user_id': 'user-1',
        'court_id': 'court-1',
        'start_time': '2026-05-20T10:00:00Z',
        'end_time': '2026-05-20T11:00:00Z',
        'total_price': 1200.0,
        'status': 'CONFIRMED',
        'payment_status': 'paid',
        'notes': 'Morning slot',
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      };

      final booking = Booking.fromJson(json);

      expect(booking.id, 'booking-1');
      expect(booking.userId, 'user-1');
      expect(booking.courtId, 'court-1');
      expect(booking.startTime, DateTime.parse('2026-05-20T10:00:00Z'));
      expect(booking.endTime, DateTime.parse('2026-05-20T11:00:00Z'));
      expect(booking.totalPrice, 1200.0);
      expect(booking.status, BookingStatus.confirmed);
      expect(booking.paymentStatus, 'paid');
      expect(booking.notes, 'Morning slot');
    });

    test('parses camelCase JSON', () {
      final now = DateTime.now();
      final json = {
        'id': 'booking-2',
        'userId': 'user-2',
        'courtId': 'court-2',
        'startTime': '2026-05-20T14:00:00Z',
        'endTime': '2026-05-20T15:00:00Z',
        'totalPrice': 800.0,
        'status': 'PENDING',
        'paymentStatus': 'pending',
        'createdAt': now.toIso8601String(),
        'updatedAt': now.toIso8601String(),
      };

      final booking = Booking.fromJson(json);

      expect(booking.id, 'booking-2');
      expect(booking.userId, 'user-2');
      expect(booking.courtId, 'court-2');
      expect(booking.totalPrice, 800.0);
      expect(booking.status, BookingStatus.pending);
    });

    test('handles missing optional fields', () {
      final json = {
        'id': 'booking-3',
        'user_id': 'user-3',
        'court_id': 'court-3',
        'start_time': '2026-05-20T10:00:00Z',
        'end_time': '2026-05-20T11:00:00Z',
        'total_price': 500,
        'status': 'PENDING',
        'created_at': '2026-05-18T08:00:00Z',
        'updated_at': '2026-05-18T08:00:00Z',
      };

      final booking = Booking.fromJson(json);

      expect(booking.paymentStatus, isNull);
      expect(booking.notes, isNull);
      expect(booking.court, isNull);
    });

    test('defaults to pending for unknown status', () {
      final now = DateTime.now();
      final json = {
        'id': 'booking-4',
        'user_id': 'user-4',
        'court_id': 'court-4',
        'start_time': '2026-05-20T10:00:00Z',
        'end_time': '2026-05-20T11:00:00Z',
        'total_price': 0,
        'status': 'INVALID',
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      };

      final booking = Booking.fromJson(json);
      expect(booking.status, BookingStatus.pending);
    });
  });

  group('Booking.toJson', () {
    test('serializes to PostgreSQL-style snake_case JSON', () {
      final now = DateTime.now();
      final startTime = DateTime(2026, 5, 20, 10, 0, 0);
      final endTime = DateTime(2026, 5, 20, 11, 0, 0);

      final booking = Booking(
        id: 'booking-1',
        userId: 'user-1',
        courtId: 'court-1',
        startTime: startTime,
        endTime: endTime,
        totalPrice: 1200.0,
        status: BookingStatus.confirmed,
        paymentStatus: 'paid',
        notes: 'Test',
        createdAt: now,
        updatedAt: now,
      );

      final json = booking.toJson();

      expect(json['id'], 'booking-1');
      expect(json['user_id'], 'user-1');
      expect(json['court_id'], 'court-1');
      expect(json['start_time'], startTime.toIso8601String());
      expect(json['end_time'], endTime.toIso8601String());
      expect(json['total_price'], 1200.0);
      expect(json['status'], 'CONFIRMED');
      expect(json['payment_status'], 'paid');
      expect(json['notes'], 'Test');
    });

    test('does not include court in toJson', () {
      final now = DateTime.now();
      final venue = Venue(
        id: 'venue-1',
        name: 'Test Venue',
        location: 'Test',
        description: 'Test',
        imageUrl: 'test.jpg',
        createdAt: now,
        updatedAt: now,
      );
      final court = Court(
        id: 'court-1',
        venueId: 'venue-1',
        name: 'Court A',
        createdAt: now,
        updatedAt: now,
        venue: venue,
      );
      final booking = Booking(
        id: 'booking-1',
        userId: 'user-1',
        courtId: 'court-1',
        startTime: now,
        endTime: now.add(const Duration(hours: 1)),
        totalPrice: 500.0,
        status: BookingStatus.pending,
        createdAt: now,
        updatedAt: now,
        court: court,
      );

      final json = booking.toJson();
      expect(json.containsKey('court'), isFalse);
    });
  });

  group('Booking.copyWith', () {
    final now = DateTime.now();

    test('returns same values when no arguments provided', () {
      final booking = Booking(
        id: 'booking-1',
        userId: 'user-1',
        courtId: 'court-1',
        startTime: now,
        endTime: now.add(const Duration(hours: 1)),
        totalPrice: 500.0,
        status: BookingStatus.pending,
        createdAt: now,
        updatedAt: now,
      );

      final copy = booking.copyWith();

      expect(copy.id, booking.id);
      expect(copy.userId, booking.userId);
      expect(copy.courtId, booking.courtId);
      expect(copy.startTime, booking.startTime);
      expect(copy.endTime, booking.endTime);
      expect(copy.totalPrice, booking.totalPrice);
      expect(copy.status, booking.status);
    });

    test('updates provided fields', () {
      final booking = Booking(
        id: 'booking-1',
        userId: 'user-1',
        courtId: 'court-1',
        startTime: now,
        endTime: now.add(const Duration(hours: 1)),
        totalPrice: 500.0,
        status: BookingStatus.pending,
        createdAt: now,
        updatedAt: now,
      );

      final updated = booking.copyWith(
        status: BookingStatus.confirmed,
        totalPrice: 750.0,
        notes: 'Updated notes',
      );

      expect(updated.status, BookingStatus.confirmed);
      expect(updated.totalPrice, 750.0);
      expect(updated.notes, 'Updated notes');
      expect(updated.id, booking.id); // unchanged
    });
  });

  group('Venue Booking Integration', () {
    test('creates a complete venue booking from JSON', () {
      final json = {
        'id': 'booking-100',
        'user_id': 'user-100',
        'court_id': 'court-100',
        'start_time': '2026-05-20T18:00:00Z',
        'end_time': '2026-05-20T19:00:00Z',
        'total_price': 2000.0,
        'status': 'CONFIRMED',
        'payment_status': 'paid',
        'notes': 'Evening cricket slot',
        'court': {
          'id': 'court-100',
          'venue_id': 'venue-100',
          'name': 'Turf A',
          'created_at': '2026-05-01T00:00:00Z',
          'updated_at': '2026-05-01T00:00:00Z',
          'venue': {
            'id': 'venue-100',
            'name': 'BM Sportz Arena',
            'location': 'Mumbai',
            'description': 'Premium cricket turf',
            'image_url': 'https://example.com/arena.jpg',
            'sports': ['Cricket', 'Football'],
            'price_per_hour': 2000,
            'rating': 4.8,
            'opening_time': '06:00',
            'closing_time': '23:00',
            'amenities': ['Parking', 'Lights'],
            'is_active': true,
          },
        },
        'created_at': '2026-05-18T10:00:00Z',
        'updated_at': '2026-05-18T10:00:00Z',
      };

      final booking = Booking.fromJson(json);

      expect(booking.id, 'booking-100');
      expect(booking.groundName, 'BM Sportz Arena');
      expect(booking.courtName, 'Turf A');
      expect(booking.confirmed, isTrue);
      expect(booking.durationText, '1 hour');
      expect(booking.totalPrice, 2000.0);
    });
  });
}
