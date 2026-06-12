import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../core/constants/app_colors.dart';

/// Renders a legal / content page from the Kridaz web frontend inside a
/// WebView so copy stays canonical across platforms. The router passes the
/// page slug (e.g. "terms", "privacy") which maps to the matching web URL.
class LegalWebViewScreen extends StatefulWidget {
  final String slug;
  const LegalWebViewScreen({super.key, required this.slug});

  static const _base = 'https://kridaz.com'; // public marketing site
  static const _pages = {
    'terms': ('/legal/terms', 'Terms of Service'),
    'privacy': ('/legal/privacy', 'Privacy Policy'),
    'faq': ('/legal/faq', 'FAQ'),
    'contact': ('/legal/contact', 'Contact Us'),
    'data-deletion': ('/legal/data-deletion', 'Data Deletion'),
  };

  @override
  State<LegalWebViewScreen> createState() => _LegalWebViewScreenState();
}

class _LegalWebViewScreenState extends State<LegalWebViewScreen> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    final entry = LegalWebViewScreen._pages[widget.slug] ??
        ('/legal/${widget.slug}', 'Legal');
    final url = '${LegalWebViewScreen._base}${entry.$1}';
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) =>
            mounted ? setState(() => _loading = false) : null,
      ))
      ..loadRequest(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    final title = LegalWebViewScreen._pages[widget.slug]?.$2 ?? 'Legal';
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(title, style: const TextStyle(color: Colors.white)),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading)
            const Center(
                child: CircularProgressIndicator(color: AppColors.primary)),
        ],
      ),
    );
  }
}
