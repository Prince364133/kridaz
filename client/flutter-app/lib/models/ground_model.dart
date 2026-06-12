class GroundModel {
  final String id;
  final String name;
  final String city;
  final String state;
  final List<String> images;
  final double pricePerHour;
  final List<String> sportTypes;

  const GroundModel({
    required this.id,
    required this.name,
    required this.city,
    required this.state,
    required this.images,
    required this.pricePerHour,
    required this.sportTypes,
  });

  factory GroundModel.fromJson(Map<String, dynamic> json) {
    // Backend may use 'id' (Prisma) or '_id' (Mongo)
    final id = json['id']?.toString() ?? json['_id']?.toString() ?? '';
    // pricePerHour may be a Prisma Decimal string
    final price = json['pricePerHour'];
    final pricePerHour = price is num
        ? price.toDouble()
        : double.tryParse(price?.toString() ?? '0') ?? 0;
    // images may be at 'images' or derive from single 'image' field
    final imgList = json['images'] as List?;
    final imgSingle = json['image']?.toString();
    final images = imgList != null
        ? List<String>.from(imgList)
        : (imgSingle != null && imgSingle.isNotEmpty
            ? [imgSingle]
            : <String>[]);

    return GroundModel(
      id: id,
      name: json['name']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      images: images,
      pricePerHour: pricePerHour,
      sportTypes: List<String>.from(json['sportTypes'] ?? []),
    );
  }
}
