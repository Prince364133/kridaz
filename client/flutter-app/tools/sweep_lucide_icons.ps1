# Swap Material `Icons.X` calls to `LucideIcons.Y` for visual parity with
# the Kridaz web frontend (which uses lucide-react).
#
# Word-boundary regex (negative lookahead) makes sure `Icons.delete` doesn't
# accidentally clobber `Icons.delete_outline`.
#
# Sport-specific Material icons (sports_cricket, sports_tennis, stadium, …)
# are intentionally left alone — Lucide has no direct equivalents that
# preserve semantic meaning.

$ErrorActionPreference = 'Stop'
$libDir = "C:\Users\Hp\Desktop\bms\bms\lib"

# Ordered list of (Material name, Lucide name) pairs. Most-used first.
$pairs = @(
    # arrows / chevrons
    @("arrow_back", "arrowLeft"),
    @("arrow_back_ios_new", "chevronLeft"),
    @("arrow_back_ios", "chevronLeft"),
    @("arrow_forward_ios", "chevronRight"),
    @("arrow_forward", "arrowRight"),
    @("arrow_drop_down", "chevronDown"),
    @("arrow_drop_up", "chevronUp"),
    @("arrow_upward", "arrowUp"),
    @("arrow_downward", "arrowDown"),
    @("chevron_left", "chevronLeft"),
    @("chevron_right", "chevronRight"),
    @("keyboard_arrow_down", "chevronDown"),
    @("keyboard_arrow_up", "chevronUp"),
    @("keyboard_arrow_right", "chevronRight"),
    @("keyboard_arrow_left", "chevronLeft"),
    @("expand_more", "chevronDown"),
    @("expand_less", "chevronUp"),

    # people / users
    @("person_add_outlined", "userPlus"),
    @("person_add", "userPlus"),
    @("person_outline", "user"),
    @("person", "user"),
    @("people_outline", "users"),
    @("people", "users"),
    @("group_outlined", "users"),
    @("group", "users"),
    @("account_circle", "userCircle"),

    # actions
    @("search_off", "searchX"),
    @("search", "search"),
    @("close", "x"),
    @("add_circle_outline", "plusCircle"),
    @("add_circle", "plusCircle"),
    @("add_a_photo_outlined", "camera"),
    @("add_a_photo", "camera"),
    @("add", "plus"),
    @("remove_circle_outline", "minusCircle"),
    @("remove", "minus"),
    @("check_circle_outline", "circleCheck"),
    @("check_circle", "circleCheck"),
    @("check", "check"),
    @("edit_outlined", "pencil"),
    @("edit", "pencil"),
    @("delete_outline", "trash2"),
    @("delete", "trash2"),
    @("share_outlined", "share2"),
    @("share", "share2"),
    @("send_outlined", "send"),
    @("send", "send"),
    @("copy_outlined", "copy"),
    @("copy", "copy"),
    @("content_copy", "copy"),
    @("refresh", "refreshCw"),
    @("download", "download"),
    @("upload", "upload"),
    @("cloud_upload", "uploadCloud"),
    @("cloud_download", "downloadCloud"),
    @("cancel_outlined", "circleX"),
    @("cancel", "circleX"),
    @("block", "ban"),

    # time / date
    @("access_time_outlined", "clock"),
    @("access_time", "clock"),
    @("calendar_today_outlined", "calendar"),
    @("calendar_today", "calendar"),
    @("event", "calendar"),
    @("today", "calendarDays"),

    # location / map
    @("location_on_outlined", "mapPin"),
    @("location_on", "mapPin"),
    @("location_searching", "locate"),
    @("my_location", "locateFixed"),
    @("place", "mapPin"),
    @("near_me", "navigation"),
    @("explore", "compass"),
    @("directions_run", "activity"),

    # favorites / awards
    @("favorite_border", "heart"),
    @("favorite", "heart"),
    @("star_border", "star"),
    @("star_outlined", "star"),
    @("star", "star"),
    @("emoji_events_outlined", "trophy"),
    @("emoji_events", "trophy"),
    @("workspace_premium", "award"),
    @("bookmark_border", "bookmark"),
    @("bookmark_outlined", "bookmark"),
    @("bookmark", "bookmark"),

    # bell / notifications
    @("notifications_none", "bell"),
    @("notifications_outlined", "bell"),
    @("notifications_active", "bellRing"),
    @("notifications_off", "bellOff"),
    @("notifications", "bell"),

    # nav / settings / menu
    @("settings_outlined", "settings"),
    @("settings", "settings"),
    @("menu_outlined", "menu"),
    @("menu", "menu"),
    @("more_vert", "moreVertical"),
    @("more_horiz", "moreHorizontal"),
    @("home_outlined", "home"),
    @("home", "home"),
    @("logout", "logOut"),
    @("login", "logIn"),

    # mail / phone / lock
    @("mail_outline", "mail"),
    @("email_outlined", "mail"),
    @("email", "mail"),
    @("phone_outlined", "phone"),
    @("phone", "phone"),
    @("call", "phone"),
    @("lock_outline", "lock"),
    @("lock_open", "unlock"),
    @("lock", "lock"),

    # visibility
    @("visibility_off_outlined", "eyeOff"),
    @("visibility_off", "eyeOff"),
    @("visibility_outlined", "eye"),
    @("visibility", "eye"),

    # chat
    @("chat_bubble_outline_rounded", "messageCircle"),
    @("chat_bubble_outline", "messageCircle"),
    @("chat_bubble", "messageCircle"),
    @("chat_outlined", "messageCircle"),
    @("chat", "messageCircle"),
    @("forum_outlined", "messagesSquare"),
    @("forum", "messagesSquare"),
    @("question_answer", "messagesSquare"),

    # camera / media
    @("camera_alt_outlined", "camera"),
    @("camera_alt", "camera"),
    @("photo_camera_outlined", "camera"),
    @("photo_camera", "camera"),
    @("image_outlined", "image"),
    @("image", "image"),
    @("photo_library_outlined", "images"),
    @("photo_library", "images"),
    @("videocam_outlined", "video"),
    @("videocam", "video"),
    @("mic_off", "micOff"),
    @("mic", "mic"),
    @("attach_file", "paperclip"),

    # commerce
    @("shopping_cart_outlined", "shoppingCart"),
    @("shopping_cart", "shoppingCart"),
    @("shopping_bag_outlined", "shoppingBag"),
    @("shopping_bag", "shoppingBag"),
    @("local_mall", "shoppingBag"),
    @("local_offer_outlined", "tag"),
    @("local_offer", "tag"),
    @("discount", "percent"),
    @("percent", "percent"),
    @("currency_rupee", "indianRupee"),
    @("account_balance_wallet_outlined", "wallet"),
    @("account_balance_wallet", "wallet"),
    @("account_balance", "landmark"),
    @("qr_code_2", "qrCode"),
    @("qr_code", "qrCode"),

    # info / status
    @("info_outline", "info"),
    @("info_outlined", "info"),
    @("info", "info"),
    @("warning_amber_outlined", "alertTriangle"),
    @("warning_amber", "alertTriangle"),
    @("warning", "alertTriangle"),
    @("error_outline", "circleAlert"),
    @("error_outlined", "circleAlert"),
    @("error", "circleAlert"),
    @("help_outline", "circleHelp"),
    @("help", "circleHelp"),

    # filter / sort / list
    @("tune", "sliders"),
    @("filter_list", "listFilter"),
    @("filter_alt", "filter"),
    @("sort", "arrowUpDown"),
    @("grid_view", "layoutGrid"),
    @("view_list", "list"),
    @("list", "list"),

    # play / pause / video controls
    @("play_circle_fill", "circlePlay"),
    @("play_circle", "circlePlay"),
    @("play_arrow", "play"),
    @("pause", "pause"),
    @("skip_next", "skipForward"),
    @("skip_previous", "skipBack"),
    @("volume_up", "volume2"),
    @("volume_off", "volumeX"),
    @("fullscreen_exit", "minimize"),
    @("fullscreen", "maximize"),
    @("zoom_in", "zoomIn"),
    @("zoom_out", "zoomOut"),

    # social / tags
    @("thumb_up_outlined", "thumbsUp"),
    @("thumb_up", "thumbsUp"),
    @("thumb_down_outlined", "thumbsDown"),
    @("thumb_down", "thumbsDown"),
    @("tag_outlined", "tag"),
    @("tag", "tag"),
    @("flag_outlined", "flag"),
    @("flag", "flag"),
    @("language", "globe"),
    @("public", "globe"),

    # connectivity
    @("wifi_off", "wifiOff"),
    @("wifi", "wifi"),
    @("signal_cellular_alt", "signal"),

    # file / folder
    @("description", "fileText"),
    @("folder", "folder"),
    @("folder_outlined", "folder"),
    @("attach_money", "dollarSign"),

    # security
    @("security", "shield"),
    @("verified", "badgeCheck"),
    @("verified_outlined", "badgeCheck"),
    @("verified_user", "shieldCheck"),

    # --- Second-pass cleanup of remaining mappable icons ---
    @("shield", "shield"),
    @("account_balance_outlined", "landmark"),
    @("upload_file", "upload"),
    @("star_rounded", "star"),
    @("reply_rounded", "reply"),
    @("reply", "reply"),
    @("radio_button_unchecked", "circle"),
    @("radio_button_checked", "circleDot"),
    @("person_outline_rounded", "user"),
    @("payment", "creditCard"),
    @("credit_card_outlined", "creditCard"),
    @("credit_card", "creditCard"),
    @("map_outlined", "map"),
    @("map", "map"),
    @("location_pin", "mapPin"),
    @("fitness_center", "dumbbell"),
    @("done_all", "checkCheck"),
    @("delete_forever_outlined", "trash2"),
    @("delete_forever", "trash2"),
    @("confirmation_number_outlined", "ticket"),
    @("confirmation_number", "ticket"),
    @("checkroom_outlined", "shirt"),
    @("checkroom", "shirt"),
    @("broken_image_outlined", "imageOff"),
    @("broken_image", "imageOff"),
    @("apps", "layoutGrid"),
    @("dashboard", "layoutDashboard"),
    @("dashboard_outlined", "layoutDashboard"),
    @("history", "history"),
    @("schedule", "clock"),
    @("alarm", "alarmClock"),
    @("timer", "timer"),
    @("comment_outlined", "messageSquare"),
    @("comment", "messageSquare"),
    @("note_add", "filePlus"),
    @("note", "stickyNote"),
    @("save_alt", "save"),
    @("save", "save"),
    @("print", "printer"),
    @("link", "link"),
    @("link_off", "unlink"),
    @("open_in_new", "externalLink"),
    @("launch", "externalLink"),
    @("trending_up", "trendingUp"),
    @("trending_down", "trendingDown"),
    @("flash_on", "zap"),
    @("flash_off", "zapOff"),
    @("brightness_high", "sun"),
    @("brightness_low", "moon"),
    @("palette", "palette"),
    @("color_lens", "palette"),
    @("battery_full", "batteryFull"),
    @("battery_charging_full", "batteryCharging"),
    @("close_fullscreen", "minimize2"),
    @("open_in_full", "maximize2"),
    @("expand", "maximize"),
    @("collapse", "minimize"),

    # Third pass: long-tail 1-use icons
    @("undo", "rotateCcw"),
    @("redo", "rotateCw"),
    @("timelapse_outlined", "hourglass"),
    @("hourglass_empty", "hourglass"),
    @("smartphone_outlined", "smartphone"),
    @("smartphone", "smartphone"),
    @("shield_rounded", "shield"),
    @("shield_outlined", "shield"),
    @("sentiment_satisfied_alt_outlined", "smile"),
    @("sentiment_satisfied", "smile"),
    @("sentiment_very_satisfied", "smile"),
    @("restaurant_menu", "utensils"),
    @("restaurant", "utensils"),
    @("remove_moderator_outlined", "shieldOff"),
    @("refresh_rounded", "refreshCw"),
    @("receipt_long_outlined", "receipt"),
    @("receipt_long", "receipt"),
    @("receipt", "receipt"),
    @("psychology_outlined", "brain"),
    @("psychology_alt", "brain"),
    @("psychology", "brain"),
    @("park", "trees"),
    @("nature", "trees"),
    @("ac_unit", "snowflake"),
    @("local_drink", "cupSoda"),
    @("local_fire_department", "flame"),
    @("local_cafe", "coffee"),
    @("local_florist", "flower"),
    @("local_hospital", "hospital"),
    @("local_parking", "parkingSquare"),
    @("local_taxi", "car"),
    @("local_atm", "banknote"),
    @("emoji_emotions", "smile"),
    @("emoji_emotions_outlined", "smile"),
    @("celebration", "partyPopper"),
    @("celebration_outlined", "partyPopper"),
    @("auto_awesome", "sparkles"),
    @("auto_awesome_outlined", "sparkles"),
    @("ondemand_video", "video"),
    @("photo_size_select_actual", "image"),
    @("file_download", "download"),
    @("file_upload", "upload"),
    @("insert_drive_file", "file"),
    @("attachment", "paperclip"),
    @("school", "graduationCap"),
    @("school_outlined", "graduationCap"),
    @("book_outlined", "book"),
    @("book", "book"),
    @("library_books", "library"),
    @("article_outlined", "fileText"),
    @("article", "fileText"),
    @("event_available", "calendarCheck"),
    @("event_busy", "calendarX"),
    @("event_note", "calendarClock"),
    @("watch_later", "clock"),
    @("hourglass_top", "hourglass"),
    @("hourglass_bottom", "hourglass"),
    @("dnd_forwardslash", "ban"),
    @("do_not_disturb_on", "ban"),
    @("do_not_disturb", "ban"),
    @("priority_high", "alertOctagon"),
    @("notification_important", "bellRing"),
    @("sync", "refreshCw"),
    @("sync_alt", "arrowRightLeft"),
    @("swap_horiz", "arrowRightLeft"),
    @("swap_vert", "arrowUpDown"),
    @("compare_arrows", "arrowRightLeft"),
    @("touch_app", "pointer"),
    @("ads_click", "mousePointerClick"),
    @("mouse", "mousePointer2"),
    @("keyboard", "keyboard"),
    @("computer", "monitor"),
    @("laptop", "laptop"),
    @("tablet", "tablet"),
    @("tv", "tv"),
    @("headset", "headphones"),
    @("speaker", "speaker"),
    @("router", "router"),
    @("cable", "cable"),
    @("usb", "usb"),
    @("memory", "cpu"),
    @("storage", "hardDrive"),
    @("cloud", "cloud"),
    @("cloud_off", "cloudOff"),
    @("backup", "uploadCloud"),
    @("restore", "rotateCcw")
)

# Files to update
$files = Get-ChildItem -Path $libDir -Recurse -Filter *.dart -File
$totalReplacements = 0
$filesChanged = 0
$importsAdded = 0

# Build a single regex pass for efficiency: alternation of all keys.
# Use \b for word boundary so Icons.delete doesn't eat Icons.delete_outline.
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ([string]::IsNullOrEmpty($content)) { continue }

    $original = $content
    $hadLucideImport = $content -match "import\s+['""]package:lucide_icons/lucide_icons\.dart['""]"
    $fileReplacements = 0

    foreach ($pair in $pairs) {
        $matIcon = $pair[0]
        $lucideIcon = $pair[1]
        # Match Icons.<matIcon> not followed by an identifier character
        $pattern = "\bIcons\.$matIcon(?![A-Za-z0-9_])"
        $matches = [regex]::Matches($content, $pattern)
        if ($matches.Count -gt 0) {
            $content = [regex]::Replace($content, $pattern, "LucideIcons.$lucideIcon")
            $fileReplacements += $matches.Count
        }
    }

    if ($content -ne $original) {
        $filesChanged++
        $totalReplacements += $fileReplacements

        # Add lucide import if file now references LucideIcons and didn't before
        if (-not $hadLucideImport -and ($content -match 'LucideIcons\.')) {
            $importLine = "import 'package:lucide_icons/lucide_icons.dart';`r`n"
            # Insert right after `package:flutter/material.dart` so the order
            # stays familiar (Flutter first, then third-party packages).
            $content = [regex]::Replace($content,
                "(import\s+'package:flutter/material\.dart';\r?\n)",
                "`$1$importLine", 1)
            $importsAdded++
        }

        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Output "=========================================="
Write-Output "Files changed:        $filesChanged"
Write-Output "Icon replacements:    $totalReplacements"
Write-Output "Lucide imports added: $importsAdded"
Write-Output "=========================================="
