import 'package:dio/dio.dart';
import 'api_service.dart';

double _asDouble(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString()) ?? 0;
}

int _asInt(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString().split('.').first) ?? 0;
}

class Professional {
  final String id;
  final String name;
  final String profession;
  final String specialization;
  final double rating;
  final String reviews;
  final int hourlyRate;
  final int experience; // years
  final String imageUrl;
  final String description;
  final List<String> skills;
  final List<String> certifications;
  final String availability;

  Professional({
    required this.id,
    required this.name,
    required this.profession,
    required this.specialization,
    this.rating = 0.0,
    this.reviews = '',
    required this.hourlyRate,
    required this.experience,
    required this.imageUrl,
    this.description = '',
    this.skills = const [],
    this.certifications = const [],
    this.availability = 'Available',
  });

  factory Professional.fromJson(Map<String, dynamic> j) {
    // Backend `/professional/list` returns flat fields shaped by
    // professional.controller.js — name/role/city/state/image at the top
    // level with specialization/experience/rating/numReviews also flat.
    // `/professional/details/:id` and legacy callers may nest things under
    // `businessDetails` or surface a `user` sub-object, so try those too.
    final biz = (j['businessDetails'] as Map?)?.cast<String, dynamic>() ??
        const <String, dynamic>{};
    final user = (j['user'] as Map?)?.cast<String, dynamic>() ??
        const <String, dynamic>{};

    final certs =
        (biz['certifications'] ?? j['certifications'] ?? const []) as List;
    final skills = (j['skills'] as List?) ?? const [];

    final rawProfession =
        (j['role'] ?? user['role'] ?? j['profession'] ?? j['type'] ?? '')
            .toString();

    return Professional(
      id: (j['_id'] ?? j['id'] ?? '').toString(),
      name: (j['name'] ?? user['name'] ?? j['fullName'] ?? '').toString(),
      profession: _prettifyRole(rawProfession),
      specialization:
          (biz['specialization'] ?? j['specialization'] ?? '').toString(),
      rating: _asDouble(j['rating']),
      reviews: (j['numReviews'] ?? j['reviews'] ?? '').toString(),
      hourlyRate: _asInt(j['price'] ?? j['hourlyRate']),
      experience: _asInt(biz['experience'] ?? j['experience']),
      imageUrl: (j['image'] ??
              j['profilePicture'] ??
              user['profilePicture'] ??
              j['imageUrl'] ??
              j['photoUrl'] ??
              j['avatar'] ??
              '')
          .toString(),
      description:
          (biz['bio'] ?? j['description'] ?? j['bio'] ?? '').toString(),
      skills: skills.map((e) => e.toString()).toList(),
      certifications: certs.map((e) => e.toString()).toList(),
      availability:
          (j['availability'] ?? j['status'] ?? 'Available').toString(),
    );
  }

  static String _prettifyRole(String role) {
    if (role.isEmpty) return role;
    switch (role.toLowerCase()) {
      case 'coach':
        return 'Coach';
      case 'umpire':
        return 'Umpire';
      case 'scorer':
        return 'Scorer';
      case 'streamer':
        return 'Streamer';
      default:
        return role[0].toUpperCase() + role.substring(1).toLowerCase();
    }
  }
}

class ProfessionalsService {
  static final ProfessionalsService _instance =
      ProfessionalsService._internal();
  factory ProfessionalsService() => _instance;

  late final Dio _dio;
  bool _hasLoadedRemote = false;
  String? lastFetchError;

  ProfessionalsService._internal() {
    _dio = ApiService.createSharedDio(
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
    );
  }

  /// Loads professionals from the server and caches them locally.
  /// Returns true on success. On failure, [lastFetchError] holds the reason
  /// and the in-memory mock list (below) remains available.
  Future<bool> fetchAll() async {
    lastFetchError = null;
    try {
      final response = await _dio.get('/professional/list');
      final data = response.data;
      List? list;
      if (data is List) {
        list = data;
      } else if (data is Map) {
        list = (data['professionals'] ??
            data['data'] ??
            data['result'] ??
            data['list']) as List?;
      }
      if (list == null) {
        lastFetchError = 'Unexpected response shape: ${data.runtimeType}';
        return false;
      }
      final parsed = list
          .whereType<Map>()
          .map((m) => Professional.fromJson(Map<String, dynamic>.from(m)))
          .where((p) => p.id.isNotEmpty)
          .toList();
      if (parsed.isNotEmpty) {
        _professionals
          ..clear()
          ..addAll(parsed);
        _hasLoadedRemote = true;
      }
      return parsed.isNotEmpty;
    } on DioException catch (e) {
      lastFetchError = _extractMessage(e.response?.data) ??
          'Network error (${e.response?.statusCode ?? e.type.name})';
      return false;
    } catch (e) {
      lastFetchError = e.toString();
      return false;
    }
  }

  bool get hasLoadedRemote => _hasLoadedRemote;

  /// GET /professional/details/:id — fetch a single professional with live
  /// rating + review count. Matches the web client's contract. Returns null
  /// when the request fails so callers can fall back to local cache.
  Future<Professional?> fetchProfessionalDetails(String id) async {
    if (id.isEmpty) return null;
    try {
      final response = await _dio.get('/professional/details/$id');
      final data = response.data;
      Map<String, dynamic>? json;
      if (data is Map) {
        // Backend wraps under `professional`, `data`, or returns flat.
        final wrapped = data['professional'] ?? data['data'] ?? data['result'];
        json = (wrapped is Map ? wrapped : data).cast<String, dynamic>();
      }
      if (json == null) return null;
      final p = Professional.fromJson(json);
      if (p.id.isEmpty) return null;
      // Refresh the cached entry so list views see the updated rating too.
      final idx = _professionals.indexWhere((e) => e.id == p.id);
      if (idx == -1) {
        _professionals.add(p);
      } else {
        _professionals[idx] = p;
      }
      return p;
    } on DioException {
      return null;
    } catch (_) {
      return null;
    }
  }

  String? _extractMessage(dynamic data) {
    if (data is Map) {
      for (final k in const ['message', 'error', 'msg', 'detail']) {
        final v = data[k];
        if (v is String && v.isNotEmpty) return v;
      }
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }

  final List<Professional> _professionals = <Professional>[
    Professional(
      id: 'prof_1',
      name: 'Coach Rajesh Kumar',
      profession: 'Football Coach',
      specialization: 'Youth Development & Tactics',
      rating: 4.9,
      reviews: '234',
      hourlyRate: 2000,
      experience: 12,
      imageUrl:
          'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&q=80',
      availability: 'Available',
      description: '''Professional Profile

Coach Rajesh Kumar - Football Coach

UEFA B Licensed football coach with 12 years of experience in youth development and tactical training. Specialized in building strong fundamentals, game intelligence, and team coordination. Former professional player with extensive tournament experience.

Expertise:
• Youth football development (U-10 to U-18)
• Tactical training and game strategy
• Individual skill development
• Position-specific training
• Team building and leadership
• Match preparation and analysis
• Physical conditioning for football
• Goalkeeper training basics

Coaching Philosophy:
Focus on developing well-rounded players with strong technical skills, tactical awareness, and mental toughness. Emphasis on positive reinforcement and building confidence while maintaining discipline and work ethic.

Experience Highlights:
• Head coach for state-level youth team (2018-2022)
• Trained 15+ players who joined professional academies
• Tournament wins: 8 district championships, 3 state titles
• Conducted 500+ training sessions
• Worked with players aged 8-19

Session Structure:
• Warm-up and conditioning (15 mins)
• Technical drills (30 mins)
• Tactical exercises (30 mins)
• Small-sided games (30 mins)
• Cool-down and feedback (15 mins)

Available For: Individual training, team coaching, tactical sessions, tournament preparation''',
      skills: [
        'Tactical Training',
        'Youth Development',
        'Game Analysis',
        'Team Building'
      ],
      certifications: [
        'UEFA B License',
        'Sports Science Diploma',
        'First Aid Certified'
      ],
    ),
    Professional(
      id: 'prof_2',
      name: 'Dr. Priya Sharma',
      profession: 'Sports Physiotherapist',
      specialization: 'Injury Recovery & Prevention',
      rating: 4.8,
      reviews: '189',
      hourlyRate: 1500,
      experience: 8,
      imageUrl:
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      availability: 'Available',
      description: '''Professional Profile

Dr. Priya Sharma - Sports Physiotherapist

Certified sports physiotherapist specializing in athletic injury recovery, performance optimization, and injury prevention. Expert in treating sports-related injuries and helping athletes return to peak performance safely.

Expertise:
• Sports injury assessment and treatment
• Post-surgery rehabilitation
• Injury prevention programs
• Manual therapy and mobilization
• Strength and conditioning
• Biomechanical analysis
• Taping and strapping techniques
• Return-to-sport protocols

Common Treatments:
• Muscle strains and ligament sprains
• Tendon injuries and tendinitis
• Joint pain and instability
• Post-operative rehabilitation
• Overuse injuries
• Back and neck pain
• Running-related injuries
• Sports-specific conditioning

Treatment Approach:
Evidence-based physiotherapy combining manual therapy, exercise prescription, and education. Focus on not just treating symptoms but addressing root causes and preventing future injuries.

Experience Highlights:
• Worked with 200+ athletes across various sports
• Team physiotherapist for semi-professional cricket team
• Specialized training in ACL rehabilitation
• Sports injury prevention workshops conducted
• 95% patient satisfaction rate

Session Includes:
• Comprehensive assessment
• Hands-on treatment
• Exercise prescription
• Home program guidance
• Progress tracking

Available For: Injury treatment, rehabilitation, prevention programs, performance optimization''',
      skills: [
        'Injury Treatment',
        'Rehabilitation',
        'Manual Therapy',
        'Prevention'
      ],
      certifications: [
        'BPT',
        'MPT Sports',
        'Certified Athletic Trainer',
        'Dry Needling Certified'
      ],
    ),
    Professional(
      id: 'prof_3',
      name: 'Coach Amit Patel',
      profession: 'Tennis Coach',
      specialization: 'Advanced Techniques & Match Strategy',
      rating: 4.7,
      reviews: '156',
      hourlyRate: 2500,
      experience: 15,
      imageUrl:
          'https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?w=400&q=80',
      availability: 'Limited Slots',
      description: '''Professional Profile

Coach Amit Patel - Tennis Coach

PTR Certified professional tennis coach with 15 years of experience training players from beginners to competitive level. Former state-level player with deep understanding of modern tennis techniques and match psychology.

Expertise:
• Stroke mechanics and technique refinement
• Serve development and power generation
• Footwork and court positioning
• Match strategy and tactics
• Mental game and pressure handling
• Tournament preparation
• Video analysis and feedback
• Fitness for tennis

Training Focus:
• Forehand and backhand technique
• Serve and return strategies
• Net play and volleys
• Singles and doubles tactics
• Point construction
• Match simulation
• Physical conditioning
• Mental toughness training

Coaching Philosophy:
Build a strong technical foundation while developing tactical intelligence and mental resilience. Customize training to each player's style, strengths, and goals. Emphasis on match-play situations and competitive mindset.

Experience Highlights:
• Coached 50+ tournament players
• Students won 20+ district/state titles
• Trained 5 players who competed nationally
• Conducted 1000+ private lessons
• Specializes in junior development (10-18 years)

Session Structure:
• Dynamic warm-up (10 mins)
• Technical drills (30 mins)
• Tactical patterns (25 mins)
• Match play/points (20 mins)
• Cool-down and review (5 mins)

Available For: Private lessons, group coaching, tournament prep, video analysis sessions''',
      skills: [
        'Stroke Mechanics',
        'Match Strategy',
        'Tournament Prep',
        'Video Analysis'
      ],
      certifications: [
        'PTR Professional',
        'USPTA Certified',
        'Sports Psychology Course'
      ],
    ),
    Professional(
      id: 'prof_4',
      name: 'Nutritionist Sneha Reddy',
      profession: 'Sports Nutritionist',
      specialization: 'Performance Nutrition & Weight Management',
      rating: 4.9,
      reviews: '298',
      hourlyRate: 1200,
      experience: 10,
      imageUrl:
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80',
      availability: 'Available',
      description: '''Professional Profile

Sneha Reddy - Sports Nutritionist

Certified sports nutritionist specializing in performance optimization, body composition, and athlete fueling strategies. Expert in creating customized nutrition plans for various sports and fitness goals.

Expertise:
• Sports performance nutrition
• Weight management for athletes
• Meal planning and timing
• Supplement guidance
• Hydration strategies
• Recovery nutrition
• Pre/post-workout nutrition
• Body composition optimization

Services Offered:
• Personalized nutrition plans
• Macro and calorie calculations
• Meal prep guidance
• Supplement recommendations
• Nutrition for competition
• Weight gain/loss programs
• Vegetarian athlete nutrition
• Nutrition education workshops

Approach:
Evidence-based nutrition strategies tailored to individual needs, sport demands, and lifestyle. Focus on sustainable habits, performance enhancement, and long-term health. Regular monitoring and plan adjustments.

Experience Highlights:
• Worked with 300+ athletes
• Nutrition consultant for sports academy
• Specialized in endurance sports nutrition
• Published articles on sports nutrition
• Conducted 50+ nutrition workshops

Consultation Includes:
• Detailed assessment and goals
• Body composition analysis
• Customized meal plans
• Shopping lists and recipes
• Supplement recommendations
• Follow-up support

Available For: Individual consultations, meal planning, team workshops, competition nutrition''',
      skills: [
        'Meal Planning',
        'Performance Nutrition',
        'Weight Management',
        'Supplements'
      ],
      certifications: [
        'MSc Sports Nutrition',
        'ISSN Certified',
        'Precision Nutrition L2'
      ],
    ),
    Professional(
      id: 'prof_5',
      name: 'Coach Vikram Singh',
      profession: 'Strength & Conditioning Coach',
      specialization: 'Athletic Performance & Power Development',
      rating: 4.8,
      reviews: '167',
      hourlyRate: 1800,
      experience: 9,
      imageUrl:
          'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
      availability: 'Available',
      description: '''Professional Profile

Coach Vikram Singh - Strength & Conditioning Coach

NSCA-CSCS certified strength and conditioning specialist with 9 years of experience training athletes across multiple sports. Expert in developing power, speed, and athletic performance through scientific training methods.

Expertise:
• Strength training programming
• Power and explosiveness development
• Speed and agility training
• Olympic lifting techniques
• Periodization and planning
• Injury prevention exercises
• Sport-specific conditioning
• Movement assessment

Training Specializations:
• Explosive power development
• Sprint mechanics and speed training
• Plyometric training
• Core stability and strength
• Mobility and flexibility
• Functional movement patterns
• Recovery and regeneration
• Performance testing

Coaching Philosophy:
Science-based approach to athletic development focusing on movement quality, progressive overload, and sport-specific adaptations. Emphasis on injury prevention while maximizing performance gains.

Experience Highlights:
• Trained 150+ athletes (cricket, football, basketball)
• Improved sprint times by average 0.3 seconds
• Reduced injury rates by 40% in teams coached
• Conducted strength camps for youth athletes
• Specialized in return-to-play protocols

Session Structure:
• Movement prep and activation (10 mins)
• Strength/power work (30 mins)
• Speed/agility drills (20 mins)
• Conditioning (15 mins)
• Cool-down and mobility (10 mins)

Available For: Individual training, team sessions, performance testing, program design''',
      skills: [
        'Strength Training',
        'Speed Development',
        'Olympic Lifting',
        'Conditioning'
      ],
      certifications: [
        'NSCA-CSCS',
        'FMS Certified',
        'Olympic Weightlifting L2'
      ],
    ),
    Professional(
      id: 'prof_6',
      name: 'Coach Meera Joshi',
      profession: 'Swimming Coach',
      specialization: 'Competitive Swimming & Technique',
      rating: 4.9,
      reviews: '203',
      hourlyRate: 2200,
      experience: 14,
      imageUrl:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      availability: 'Available',
      description: '''Professional Profile

Coach Meera Joshi - Swimming Coach

ASCA Level 4 certified swimming coach with 14 years of experience coaching competitive swimmers. Former national-level swimmer with expertise in all four strokes and competitive racing strategies.

Expertise:
• All four competitive strokes
• Starts and turns technique
• Race strategy and pacing
• Endurance and speed training
• Dryland conditioning
• Video analysis
• Mental preparation
• Competition coaching

Stroke Specializations:
• Freestyle technique and efficiency
• Backstroke mechanics
• Breaststroke timing and pull
• Butterfly power and rhythm
• Individual Medley training
• Distance swimming endurance
• Sprint power development
• Open water swimming

Coaching Philosophy:
Focus on perfect technique as the foundation for speed and efficiency. Progressive training that builds endurance, power, and race-specific skills. Mental preparation for competition success.

Experience Highlights:
• Coached 80+ competitive swimmers
• Students won 30+ medals at state level
• 10 swimmers qualified for nationals
• Improved technique reduced times by 5-15%
• Specialized in age-group development

Session Structure:
• Dryland warm-up (10 mins)
• Technique drills (20 mins)
• Main set (40 mins)
• Speed work (15 mins)
• Cool-down (10 mins)

Available For: Competitive training, technique coaching, race preparation, video analysis''',
      skills: [
        'Stroke Technique',
        'Race Strategy',
        'Video Analysis',
        'Competition Prep'
      ],
      certifications: [
        'ASCA Level 4',
        'Lifeguard Certified',
        'Sports Psychology Diploma'
      ],
    ),
    Professional(
      id: 'prof_7',
      name: 'Dr. Arjun Malhotra',
      profession: 'Sports Psychologist',
      specialization: 'Mental Performance & Confidence Building',
      rating: 4.7,
      reviews: '142',
      hourlyRate: 2500,
      experience: 11,
      imageUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      availability: 'Limited Slots',
      description: '''Professional Profile

Dr. Arjun Malhotra - Sports Psychologist

Licensed sports psychologist with 11 years of experience helping athletes optimize mental performance, overcome barriers, and achieve peak performance. Specialized in performance anxiety, confidence building, and mental toughness.

Expertise:
• Performance anxiety management
• Confidence and self-belief building
• Focus and concentration training
• Pre-competition mental preparation
• Goal setting and motivation
• Stress and pressure management
• Team dynamics and communication
• Recovery from injury (mental aspect)

Mental Skills Training:
• Visualization and imagery
• Self-talk and affirmations
• Relaxation techniques
• Mindfulness for athletes
• Emotional regulation
• Dealing with failure and setbacks
• Competition mindset
• Flow state development

Approach:
Evidence-based psychological interventions tailored to individual needs. Combination of cognitive-behavioral techniques, mindfulness practices, and sport-specific mental skills training. Confidential and supportive environment.

Experience Highlights:
• Worked with 100+ athletes across sports
• Team psychologist for professional cricket team
• Helped athletes overcome performance blocks
• Conducted mental skills workshops
• Published research on sports psychology

Session Includes:
• Assessment and goal setting
• Mental skills training
• Practical exercises
• Homework assignments
• Progress tracking

Available For: Individual sessions, team workshops, pre-competition prep, ongoing support''',
      skills: [
        'Performance Anxiety',
        'Mental Toughness',
        'Visualization',
        'Goal Setting'
      ],
      certifications: [
        'PhD Sports Psychology',
        'Licensed Psychologist',
        'AASP Certified'
      ],
    ),
    Professional(
      id: 'prof_8',
      name: 'Coach Ravi Deshmukh',
      profession: 'Cricket Coach',
      specialization: 'Batting & Match Situations',
      rating: 4.8,
      reviews: '178',
      hourlyRate: 2000,
      experience: 16,
      imageUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      availability: 'Available',
      description: '''Professional Profile

Coach Ravi Deshmukh - Cricket Coach

BCCI Level 2 certified cricket coach with 16 years of coaching experience. Former first-class cricketer specializing in batting technique, match situations, and mental approach to cricket. Expert in developing young cricketers.

Expertise:
• Batting technique and shot selection
• Bowling action and variations
• Fielding and wicket-keeping
• Match situation training
• Net practice optimization
• Video analysis
• Fitness for cricket
• Tournament preparation

Batting Specialization:
• Stance and grip fundamentals
• Shot technique (all formats)
• Footwork and balance
• Playing spin and pace
• Building innings
• T20, ODI, and Test strategies
• Power hitting techniques
• Mental approach to batting

Coaching Philosophy:
Build strong technical foundations while developing game awareness and adaptability. Focus on match situations and pressure handling. Customize coaching to player's natural style and format preferences.

Experience Highlights:
• Coached 200+ cricketers (ages 8-25)
• Students selected for state teams
• Conducted 1500+ net sessions
• Specialized in batting technique
• Tournament success rate: 70%

Session Structure:
• Warm-up and stretching (10 mins)
• Technical drills (25 mins)
• Throwdowns/bowling machine (30 mins)
• Match situations (20 mins)
• Feedback and discussion (10 mins)

Available For: Batting coaching, bowling coaching, match prep, video analysis, team training''',
      skills: [
        'Batting Technique',
        'Match Situations',
        'Shot Selection',
        'Video Analysis'
      ],
      certifications: [
        'BCCI Level 2',
        'First-Class Cricketer',
        'Fitness Trainer Certified'
      ],
    ),
  ];

  List<Professional> getAllProfessionals() {
    return _professionals;
  }

  Professional? getProfessionalById(String id) {
    try {
      return _professionals.firstWhere((prof) => prof.id == id);
    } catch (e) {
      return null;
    }
  }

  List<Professional> searchProfessionals(String query) {
    if (query.isEmpty) return _professionals;

    return _professionals.where((prof) {
      return prof.name.toLowerCase().contains(query.toLowerCase()) ||
          prof.profession.toLowerCase().contains(query.toLowerCase()) ||
          prof.specialization.toLowerCase().contains(query.toLowerCase()) ||
          prof.description.toLowerCase().contains(query.toLowerCase());
    }).toList();
  }

  List<Professional> getProfessionalsByProfession(String profession) {
    return _professionals
        .where((prof) => prof.profession == profession)
        .toList();
  }

  List<Professional> getProfessionalsByRating(double minRating) {
    return _professionals.where((prof) => prof.rating >= minRating).toList();
  }
}
