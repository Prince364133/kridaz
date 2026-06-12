// Prisma Decimal fields arrive as JSON strings; these helpers handle both.
double? _toDouble(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString());
}

int? _toInt(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString());
}

bool _toBool(dynamic v, {bool fallback = false}) {
  if (v == null) return fallback;
  if (v is bool) return v;
  return v.toString().toLowerCase() == 'true';
}

/// Returns the cheapest active generatedSlots[].price (raw, not per-hour).
/// Owners price slots as whole-slot amounts (e.g. ₹7000 for a 3-hour block),
/// so we surface the slot price as-is for a "starting at ₹X" display.
/// Returns 0 when no usable slots exist.
double _deriveStartingPriceFromSlots(dynamic slotsRaw) {
  if (slotsRaw is! List) return 0;
  final prices = <double>[];
  for (final s in slotsRaw) {
    if (s is! Map) continue;
    if (s['isActive'] == false) continue;
    final price = _toDouble(s['price']) ?? 0;
    if (price > 0) prices.add(price);
  }
  if (prices.isEmpty) return 0;
  prices.sort();
  return prices.first;
}

class TurfOwner {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String? profilePicture;
  final String? role;

  TurfOwner({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.profilePicture,
    this.role,
  });

  factory TurfOwner.fromJson(Map<String, dynamic> json) {
    return TurfOwner(
      id: (json['id'] ?? json['_id'])?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      profilePicture: json['profilePicture']?.toString(),
      role: json['role']?.toString(),
    );
  }
}

class TurfGeneratedSlot {
  final String startTime;
  final String endTime;
  final double? price;
  final bool isActive;

  TurfGeneratedSlot({
    required this.startTime,
    required this.endTime,
    this.price,
    this.isActive = true,
  });

  factory TurfGeneratedSlot.fromJson(Map<String, dynamic> json) {
    return TurfGeneratedSlot(
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
      price: _toDouble(json['price']),
      isActive: _toBool(json['isActive'], fallback: true),
    );
  }
}

class ManagerContact {
  final String? name;
  final String? phone;

  ManagerContact({this.name, this.phone});

  factory ManagerContact.fromJson(Map<String, dynamic> json) {
    return ManagerContact(
      name: json['name']?.toString(),
      phone: json['phone']?.toString(),
    );
  }
}

class TurfModel {
  final String id;
  final String name;
  final String description;
  final String location;
  final String? city;
  final String? state;
  final double? latitude;
  final double? longitude;
  final String image;
  final List<String> images;
  final List<String> sportTypes;
  final List<String> groundTypes;
  final List<String> facilities;
  final String? youtubeUrl;
  final double pricePerHour;
  final String openTime;
  final String closeTime;
  final TurfOwner? owner;
  final String status;
  final bool isActive;
  final int slotDuration;
  final int breakTime;
  final List<String> availableDays;
  final List<String> offDays;
  final List<TurfGeneratedSlot> generatedSlots;
  final String? slotsConfigDuration;
  final bool slotsNeedsUpdate;
  final String? slug;
  final List<ManagerContact> managerContacts;
  final String? mapUrl;
  final String? policies;
  final double? avgRating;
  final int reviewCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TurfModel({
    required this.id,
    required this.name,
    required this.description,
    required this.location,
    this.city,
    this.state,
    this.latitude,
    this.longitude,
    required this.image,
    this.images = const [],
    this.sportTypes = const [],
    this.groundTypes = const [],
    this.facilities = const [],
    this.youtubeUrl,
    required this.pricePerHour,
    required this.openTime,
    required this.closeTime,
    this.owner,
    this.status = 'approved',
    this.isActive = true,
    this.slotDuration = 60,
    this.breakTime = 0,
    this.availableDays = const [],
    this.offDays = const [],
    this.generatedSlots = const [],
    this.slotsConfigDuration,
    this.slotsNeedsUpdate = false,
    this.slug,
    this.managerContacts = const [],
    this.mapUrl,
    this.policies,
    this.avgRating,
    this.reviewCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory TurfModel.fromJson(Map<String, dynamic> json) {
    // Backend stores coords as flat Decimal columns (`latitude`/`longitude`)
    // but some legacy responses also carry GeoJSON `locationData.coordinates
    // = [lng, lat]`. Try the flat fields first; fall back to GeoJSON.
    double? lat = _toDouble(json['latitude']);
    double? lng = _toDouble(json['longitude']);
    if (lat == null || lng == null) {
      final locData = json['locationData'];
      if (locData is Map && locData['coordinates'] is List) {
        final coords = locData['coordinates'] as List;
        if (coords.length >= 2) {
          lng ??= _toDouble(coords[0]);
          lat ??= _toDouble(coords[1]);
        }
      }
    }

    return TurfModel(
      id: (json['id'] ?? json['_id'])?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      latitude: lat,
      longitude: lng,
      image: json['image']?.toString() ?? '',
      images:
          (json['images'] as List?)?.map((e) => e.toString()).toList() ?? [],
      sportTypes:
          (json['sportTypes'] as List?)?.map((e) => e.toString()).toList() ??
              [],
      groundTypes:
          (json['groundTypes'] as List?)?.map((e) => e.toString()).toList() ??
              [],
      facilities:
          (json['facilities'] as List?)?.map((e) => e.toString()).toList() ??
              [],
      youtubeUrl: json['youtubeUrl']?.toString(),
      // Many owners only configure per-slot prices and leave the top-level
      // pricePerHour at 0. Fall back to the cheapest active slot price so
      // cards can render a meaningful "starting at ₹X" value.
      pricePerHour: () {
        final top = _toDouble(json['pricePerHour']) ?? 0;
        if (top > 0) return top;
        return _deriveStartingPriceFromSlots(json['generatedSlots']);
      }(),
      openTime: json['openTime']?.toString() ?? '',
      closeTime: json['closeTime']?.toString() ?? '',
      owner: json['owner'] is Map
          ? TurfOwner.fromJson(json['owner'] as Map<String, dynamic>)
          : null,
      status: json['status']?.toString() ?? 'approved',
      isActive: _toBool(json['isActive'], fallback: true),
      slotDuration: _toInt(json['slotDuration']) ?? 60,
      breakTime: _toInt(json['breakTime']) ?? 0,
      availableDays:
          (json['availableDays'] as List?)?.map((e) => e.toString()).toList() ??
              [],
      offDays:
          (json['offDays'] as List?)?.map((e) => e.toString()).toList() ?? [],
      generatedSlots: (json['generatedSlots'] as List?)
              ?.map(
                  (e) => TurfGeneratedSlot.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      slotsConfigDuration: json['slotsConfigDuration']?.toString(),
      slotsNeedsUpdate: _toBool(json['slotsNeedsUpdate'], fallback: false),
      slug: json['slug']?.toString(),
      managerContacts: (json['managerContacts'] as List?)
              ?.map((e) => ManagerContact.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      mapUrl: json['mapUrl']?.toString(),
      policies: json['policies']?.toString(),
      avgRating: _toDouble(json['avgRating']),
      reviewCount: (json['reviews'] as List?)?.length ??
          _toInt(json['reviewCount']) ??
          0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }
}
