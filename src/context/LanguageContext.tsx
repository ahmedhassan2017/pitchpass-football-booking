import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

interface Translations {
  appName: string;
  appSubtitle: string;
  live: string;
  // Tabs
  tabMatches: string;
  tabMySpots: string;
  tabSquad: string;
  tabAlerts: string;
  // Hero / Gate
  heroTitle1: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  signInGoogle: string;
  noSmsNeeded: string;
  invitedBadge: string;
  privateCircleBadge: string;
  capFeatureTitle: string;
  capFeatureDesc: string;
  alertFeatureTitle: string;
  alertFeatureDesc: string;
  squadFeatureTitle: string;
  squadFeatureDesc: string;
  // Approval Pending
  pendingTitle: string;
  pendingDesc: string;
  pendingStatusBadge: string;
  pendingRealtimeNotice: string;
  rejectedTitle: string;
  rejectedDesc: string;
  enterInviteCodeTitle: string;
  enterInviteCodeDesc: string;
  submitJoinRequest: string;
  reapplyBtn: string;
  changeAccount: string;
  // Matches view
  matchesHeader: string;
  matchesSubheader: string;
  scheduledBadge: (n: number) => string;
  scheduleMatchBtn: string;
  filterUpcoming: string;
  filterPast: string;
  filterCancelled: string;
  noUpcomingMatches: string;
  noUpcomingMatchesDescAdmin: string;
  noUpcomingMatchesDescMember: string;
  scheduleFirstMatch: string;
  matchOpenSpots: (n: number) => string;
  matchFull: string;
  matchCancelled: string;
  matchStarted: string;
  youAreBooked: string;
  playersCount: (c: number, max: number) => string;
  viewDetails: string;
  // Match Details Modal
  modalMatchStarted: string;
  modalSquadLineup: (max: number) => string;
  modalSpotsInfo: (confirmed: number, open: number) => string;
  modalFirstComeNotice: string;
  modalClaimSpotBtn: (slot: number, max: number) => string;
  modalClaiming: string;
  modalYouAreBooked: string;
  modalCancelSpotBtn: string;
  modalCancelling: string;
  modalMatchNotes: string;
  modalEditMatch: string;
  modalCancelMatch: string;
  modalReopenMatch: string;
  modalClose: string;
  openSlotVisual: string;
  confirmedPlayerVisual: string;
  // Match Modal (Create / Edit)
  createModalTitle: string;
  editModalTitle: string;
  fieldTitle: string;
  fieldVenue: string;
  fieldDate: string;
  fieldTime: string;
  fieldDuration: string;
  fieldMaxPlayers: string;
  fieldNotes: string;
  saveMatchBtn: string;
  cancelBtn: string;
  // My Bookings
  myBookingsHeader: string;
  myBookingsSubheader: string;
  activeSpotsCount: (n: number) => string;
  noActiveBookings: string;
  noActiveBookingsDesc: string;
  browseMatchesBtn: string;
  spotConfirmedBadge: string;
  cancelMySpot: string;
  // Squad
  squadHeader: string;
  squadSubheader: string;
  activePlayersCount: (n: number) => string;
  tabRoster: (n: number) => string;
  tabPending: (n: number) => string;
  tabInviteSettings: string;
  shareWhatsAppBtn: string;
  copyInviteBtn: string;
  inviteCopied: string;
  roleOwner: string;
  roleAdmin: string;
  roleMember: string;
  makeAdmin: string;
  demoteToMember: string;
  removeFromSquad: string;
  approveMember: string;
  rejectMember: string;
  allRequestsReviewed: string;
  activeGroupCode: string;
  regenerateCodeBtn: string;
  // Alerts
  alertsHeader: string;
  alertsSubheader: string;
  unreadBadge: (n: number) => string;
  markAllReadBtn: string;
  deleteAllAlertsBtn: string;
  confirmDeleteAllAlerts: string;
  deleteAlertTooltip: string;
  deviceAlertsTitle: string;
  deviceAlertsDesc: string;
  enableAlertsBtn: string;
  alertsEnabled: string;
  alertsBlocked: string;
  alertsNotEnabled: string;
  iphoneNotice: string;
  noAlertsYet: string;
  noAlertsYetDesc: string;
  claimSpotFromAlert: string;
  // Roles
  roleOwnerFull: string;
  roleAdminFull: string;
  roleMemberFull: string;
  ownerActiveBannerTitle: string;
  ownerActiveBannerDesc: string;
  // PWA Banner
  pwaInstallTitle: string;
  pwaInstallDesc: string;
  pwaInstallBtn: string;
  pwaIosTitle: string;
  pwaIosStep1: string;
  pwaIosStep2: string;
  pwaIosStep3: string;
  pwaIosGotIt: string;
  // Squad additions
  playerCol: string;
  roleCol: string;
  youTag: string;
  demoteBtn: string;
  makeAdminBtn: string;
  removeTooltip: string;
  pendingHeader: (n: number) => string;
  pendingSubNotice: string;
  awaitingReview: string;
  requestedAtPrefix: string;
  rejectBtn: string;
  approveBtn: string;
  whatsappInviteTitle: string;
  whatsappInviteDesc: string;
  activeCodeLabel: string;
  shareableLinkLabel: string;
  copiedBtn: string;
  copyBtn: string;
  shareDirectWhatsapp: string;
  // MyBookings additions
  oneSpotPerMatchNotice: string;
  capacityFilled: string;
  bookedAtPrefix: string;
  // MatchModal additions
  matchModalSubtitle: string;
  fieldTitlePlaceholder: string;
  fieldVenuePlaceholder: string;
  fieldKickoffTime: string;
  fieldDateAny: string;
  minsLabel: string;
  minWarningCap: string;
}

const translations: Record<Language, Translations> = {
  ar: {
    appName: 'بيتش باس',
    appSubtitle: 'حجز تقسيمات الكورة • لايف ومفيش دكة',
    live: 'مباشر',
    tabMatches: 'التقسيمات',
    tabMySpots: 'ماتشاتي',
    tabSquad: 'اللاعيبة',
    tabAlerts: 'التنبيهات',
    heroTitle1: 'احجز مكانك في التقسيمة',
    heroTitleHighlight: 'في ثانية ومفيش دكة!',
    heroSubtitle: 'ودّع لخبطة تصويتات الواتساب. حجز فوري بالعدد، التقسيمة ١٢/١٢ تقفل، وأول ما حد يعتذر مكانه يفتح فوراً للصحاب.',
    signInGoogle: 'سجل بجوجل وادخل التقسيمة',
    noSmsNeeded: 'بدون باسورد ولا رسائل SMS. تسجيل سريع ومستمر.',
    invitedBadge: 'دعوة خاصة للتقسيمة',
    privateCircleBadge: 'جروب كورة خاص للصحاب',
    capFeatureTitle: 'العدد مقفول ١٢/١٢ بالظبط',
    capFeatureDesc: 'مستحيل ينزل لاعب رقم ١٣. تحكم برمجي ذري صارم.',
    alertFeatureTitle: 'تنبيه فوري لأي مكان يفضى',
    alertFeatureDesc: 'أي حد يعتذر، يوصل إشعار فوري لكل اللاعيبة.',
    squadFeatureTitle: 'جروب خاص للصحاب',
    squadFeatureDesc: 'اللاعيبة المعتمدين فقط. محدش غريب يدخل.',
    pendingTitle: 'في انتظار اعتماد الكابتن',
    pendingDesc: 'أهلاً بيك يا لاعب! تم تسجيل طلب انضمامك لتقسيمات بيتش باس. الكابتن هيعتمد طلبك عشان تقدر تشوف المواعيد وتحجز.',
    pendingStatusBadge: 'قيد المراجعة من أدمن',
    pendingRealtimeNotice: 'الصفحة دي هتفتح لوحدها في نفس الثانية اللي الكابتن يعتمدك فيها.',
    rejectedTitle: 'تم رفض طلب الانضمام',
    rejectedDesc: 'طلبك للانضمام لم يتم قبوله. لو معاك كود دعوة جديد من الكابتن، تقدر تعيد التقديم تحت.',
    enterInviteCodeTitle: 'انضم لتقسيمة الصحاب',
    enterInviteCodeDesc: 'أهلاً بيك! اكتب كود دعوة الواتساب اللي الكابتن بعتهولك عشان تقدم على الانضمام.',
    submitJoinRequest: 'تقديم طلب الانضمام للفرقة',
    reapplyBtn: 'إعادة التقديم بالكود',
    changeAccount: 'تسجيل الدخول بحساب جوجل تاني',
    matchesHeader: 'جدول التقسيمات',
    matchesSubheader: 'أعداد مقفولة ومحسوبة. أي يوم وأي وقت. الأساسي ١٢ لاعب.',
    scheduledBadge: (n) => `${n} تقسيمات متجدولة`,
    scheduleMatchBtn: 'نظم تقسيمة جديدة',
    filterUpcoming: 'التقسيمات الجاية',
    filterPast: 'تقسيمات سابقة',
    filterCancelled: 'ملغية',
    noUpcomingMatches: 'مفيش تقسيمات متجدولة حالياً',
    noUpcomingMatchesDescAdmin: 'دوس على "نظم تقسيمة جديدة" فوق عشان تظبط ميعاد الماتش الجاي للرجالة.',
    noUpcomingMatchesDescMember: 'الكابتن لسه منظمش تقسيمة جديدة. أول ما تنزل هتوصلك إشارة!',
    scheduleFirstMatch: 'تنظيم أول تقسيمة',
    matchOpenSpots: (n) => `مفتوح • باقي ${n} ${n === 1 ? 'مكان' : 'أماكن'} بس`,
    matchFull: 'التقسيمة كاملة (١٢/١٢)',
    matchCancelled: 'التقسيمة ملغية',
    matchStarted: 'التقسيمة بدأت',
    youAreBooked: 'حاجز مكانك',
    playersCount: (c, max) => `${c}/${max} لاعب`,
    viewDetails: 'تفاصيل التقسيمة والتشكيلة ←',
    modalMatchStarted: 'التقسيمة بدأت خلاص • الحجز مقفول',
    modalSquadLineup: (max) => `تشكيلة الملعب (${max} مكان)`,
    modalSpotsInfo: (confirmed, open) => `${confirmed} مؤكدين • ${open} أماكن فاضية`,
    modalFirstComeNotice: 'النزول بأسبقية الحجز • مفيش قائمة انتظار ولا دكة',
    modalClaimSpotBtn: (slot, max) => `احجز مكانك في التقسيمة (مكان #${slot} من ${max})`,
    modalClaiming: 'جاري حجز مكانك في الملعب...',
    modalYouAreBooked: 'مكانك محجوز ومؤكد في التقسيمة!',
    modalCancelSpotBtn: 'اعتذر عن التقسيمة (فضي المكان)',
    modalCancelling: 'جاري فتح المكان للصحاب...',
    modalMatchNotes: 'تعليمات الملعب وملاحظات الماتش',
    modalEditMatch: 'تعديل التقسيمة',
    modalCancelMatch: 'إلغاء التقسيمة',
    modalReopenMatch: 'إعادة فتح التقسيمة',
    modalClose: 'إغلاق',
    openSlotVisual: '+ مكان فاضي',
    confirmedPlayerVisual: 'لاعب مؤكد',
    createModalTitle: 'تنظيم تقسيمة كورة جديدة',
    editModalTitle: 'تعديل بيانات التقسيمة',
    fieldTitle: 'عنوان أو اسم التقسيمة',
    fieldVenue: 'اسم ومكان الملعب',
    fieldDate: 'تاريخ الماتش (أي يوم)',
    fieldTime: 'ساعة النزول (ضربة البداية)',
    fieldDuration: 'مدة التقسيمة',
    fieldMaxPlayers: 'أقصى عدد لاعبين (الافتراضي: ١٢)',
    fieldNotes: 'ملاحظات الكورة (اللبس، نوع النجيل، الدفع)',
    saveMatchBtn: 'تأكيد وحفظ التقسيمة',
    cancelBtn: 'إلغاء',
    myBookingsHeader: 'ماتشاتي وحجوزاتي',
    myBookingsSubheader: 'الأماكن اللي انت حاجزها في التقسيمات. لو اعتذرت المكان بيفتح فوراً للصحاب.',
    activeSpotsCount: (n) => `${n} أماكن محجوزة`,
    noActiveBookings: 'معندكش حجوزات حالياً',
    noActiveBookingsDesc: 'لسه محجزتش في أي تقسيمة جاية. افتح صفحة التقسيمات واحجز مكانك.',
    browseMatchesBtn: 'استعراض التقسيمات الجاية',
    spotConfirmedBadge: 'مكانك محجوز في الملعب',
    cancelMySpot: 'اعتذار عن التقسيمة',
    squadHeader: 'اللاعيبة والصلاحيات',
    squadSubheader: 'جروب الصحاب الخاص. المعتمدين فقط هما اللي بيشوفوا ويحجزوا في التقسيمات.',
    activePlayersCount: (n) => `${n} لاعب معتمد`,
    tabRoster: (n) => `قائمة اللاعيبة (${n})`,
    tabPending: (n) => `طلبات الانضمام (${n})`,
    tabInviteSettings: 'إعدادات الدعوة والواتساب',
    shareWhatsAppBtn: 'شير على جروب الواتساب',
    copyInviteBtn: 'نسخ لينك الدعوة',
    inviteCopied: 'تم نسخ اللينك!',
    roleOwner: 'أدمن',
    roleAdmin: 'كابتن / منظم',
    roleMember: 'لاعب',
    makeAdmin: 'ترقية لمنظم',
    demoteToMember: 'تنزيل للاعب',
    removeFromSquad: 'حذف من الفرقة',
    approveMember: 'اعتماد اللاعب',
    rejectMember: 'رفض',
    allRequestsReviewed: 'كل الطلبات متراجعة. مفيش طلبات معلقة.',
    activeGroupCode: 'كود الدعوة الحالي',
    regenerateCodeBtn: 'توليد كود جديد',
    alertsHeader: 'مركز التنبيهات وفضيان الأماكن',
    alertsSubheader: 'أول ما أي لاعب يعتذر، بيوصل تنبيه فوري لكل الفرقة عشان اللي يلحق ينزل.',
    unreadBadge: (n) => `${n} جديد`,
    markAllReadBtn: 'تحديد الكل كمقروء',
    deleteAllAlertsBtn: 'مسح كل التنبيهات',
    confirmDeleteAllAlerts: 'هل أنت متأكد من مسح جميع التنبيهات؟',
    deleteAlertTooltip: 'حذف التنبيه',
    deviceAlertsTitle: 'إشعارات الموبايل الفورية (Push)',
    deviceAlertsDesc: 'استقبل إشعار صوتي على موبايلك أول ما مكان يفضى في أي تقسيمة.',
    enableAlertsBtn: 'تفعيل إشعارات الموبايل',
    alertsEnabled: 'مفعلة',
    alertsBlocked: 'محظورة',
    alertsNotEnabled: 'غير مفعلة',
    iphoneNotice: 'ملحوظة للآيفون: على سفاري، دوس زرار المشاركة ⎋ ثم "إضافة إلى الشاشة الرئيسية" عشان الإشعارات تشتغل.',
    noAlertsYet: 'مفيش إشعارات جديدة حالياً',
    noAlertsYetDesc: 'أول ما حد يعتذر أو الكابتن يجدول ماتش جديد، هتلاقي التنبيه ظهر هنا فوراً.',
    claimSpotFromAlert: 'شوف المكان الفاضي والحق احجزه',
    roleOwnerFull: '👑 أدمن رئيسي (Owner)',
    roleAdminFull: '🛡️ كابتن منظم (Admin)',
    roleMemberFull: '⚽ لاعب في الفرقة (Member)',
    ownerActiveBannerTitle: 'لوحة تحكم الكابتن • أدمن',
    ownerActiveBannerDesc: 'تم تفعيل حسابك كأدمن رئيسي لفرقة بيتش باس. جميع صلاحيات تنظيم التقسيمات واعتماد اللاعيبة مفعلة.',
    // PWA Banner
    pwaInstallTitle: 'نزّل تطبيق بيتش باس على الموبايل',
    pwaInstallDesc: 'حجز فوري للتقسيمات وتنبيهات الأماكن الفاضية من شاشة موبايلك الرئيسية',
    pwaInstallBtn: 'تثبيت التطبيق',
    pwaIosTitle: 'تثبيت على آيفون (سفاري)',
    pwaIosStep1: 'اضغط على زرار المشاركة ⎋ في شريط المتصفح تحت',
    pwaIosStep2: 'انزل تحت واختار "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)',
    pwaIosStep3: 'اضغط "إضافة" وهيشتغل معاك زي أي تطبيق عادي وسريع',
    pwaIosGotIt: 'فهمت خلاص',
    // Squad additions
    playerCol: 'بيانات اللاعب',
    roleCol: 'الصلاحية والإدارة',
    youTag: '(أنت)',
    demoteBtn: 'تنزيل للاعب',
    makeAdminBtn: 'ترقية لمنظم',
    removeTooltip: 'حذف من الفرقة',
    pendingHeader: (n) => `طلبات الانضمام المعلقة (${n})`,
    pendingSubNotice: 'الاعتماد هنا بيفتح كل الماتشات للاعب على طول',
    awaitingReview: 'في انتظار اعتماد الكابتن',
    requestedAtPrefix: 'تاريخ الطلب:',
    rejectBtn: 'رفض',
    approveBtn: 'اعتماد اللاعب',
    whatsappInviteTitle: 'إعدادات دعوة الواتساب',
    whatsappInviteDesc: 'ابعت اللينك ده لصحابك على جروب الواتساب. أي حد يدوس عليه هيطلب ينضم للفرقة.',
    activeCodeLabel: 'كود الدعوة الشغال',
    shareableLinkLabel: 'رابط الدعوة المباشر',
    copiedBtn: 'تم النسخ!',
    copyBtn: 'نسخ',
    shareDirectWhatsapp: 'ابعت فوراً على جروب الواتساب',
    // MyBookings additions
    oneSpotPerMatchNotice: 'مكان واحد مؤكد لكل تقسيمة. لو اعتذرت، المكان بيفتح فوراً لباقي الصحاب.',
    capacityFilled: 'لاعب متسجلين',
    bookedAtPrefix: 'تم الحجز بتاريخ:',
    // MatchModal additions
    matchModalSubtitle: 'أي يوم وأي وقت • الأساسي ١٢ لاعب • مفيش قوائم انتظار',
    fieldTitlePlaceholder: 'مثلاً: تقسيمة التلات بالليل تحت الأضواء',
    fieldVenuePlaceholder: 'مثلاً: ملعب النادي الأهلي • نجيل صناعي ترتان',
    fieldKickoffTime: 'ساعة ضربة البداية',
    fieldDateAny: 'تاريخ التقسيمة (أي يوم)',
    minsLabel: 'دقيقة',
    minWarningCap: 'تنبيه: السعة مقفولة بالملي لمنع نزول لاعب رقم ١٣',
  },
  en: {
    appName: 'PitchPass',
    appSubtitle: 'Private Football Match Booking • No Waitlist',
    live: 'Live',
    tabMatches: 'Matches',
    tabMySpots: 'My Spots',
    tabSquad: 'Squad',
    tabAlerts: 'Alerts',
    heroTitle1: 'Reserve Your Spot On',
    heroTitleHighlight: 'The Pitch In Real-Time',
    heroSubtitle: 'Replace chaotic WhatsApp polls with instant, capacity-locked bookings. Strict 12/12 limit. When someone drops out, the spot opens instantly.',
    signInGoogle: 'Sign in with Google',
    noSmsNeeded: 'No password or SMS OTP. Fast and persistent sessions.',
    invitedBadge: 'Private Group Invitation',
    privateCircleBadge: 'Private Football Circle',
    capFeatureTitle: 'Strict 12/12 Cap',
    capFeatureDesc: 'No 13th player. Atomic concurrency control prevents overbooking.',
    alertFeatureTitle: 'Instant Spot Alert',
    alertFeatureDesc: 'When anyone cancels, all approved members are notified immediately.',
    squadFeatureTitle: 'Private Squad',
    squadFeatureDesc: 'Approved friends only. Private and isolated matches.',
    pendingTitle: 'Approval Pending',
    pendingDesc: 'Welcome! Your membership request has been submitted. An Owner or Admin must approve you before you can view matches and reserve spots.',
    pendingStatusBadge: 'Awaiting Owner Approval',
    pendingRealtimeNotice: 'This page will automatically unlock the second you are approved.',
    rejectedTitle: 'Request Rejected',
    rejectedDesc: 'Your request to join was not approved. If you have an updated invite code, you can re-apply below.',
    enterInviteCodeTitle: 'Join Private Circle',
    enterInviteCodeDesc: 'Welcome! Please enter the WhatsApp invite code shared by the Group Owner to request access.',
    submitJoinRequest: 'Submit Join Request',
    reapplyBtn: 'Re-apply with Code',
    changeAccount: 'Sign in with a different Google account',
    matchesHeader: 'Match Schedules',
    matchesSubheader: 'Real-time capacity locked. Flexible dates & times. Default 12 players.',
    scheduledBadge: (n) => `${n} Scheduled`,
    scheduleMatchBtn: 'Schedule Match',
    filterUpcoming: 'Upcoming Matches',
    filterPast: 'Past Matches',
    filterCancelled: 'Cancelled',
    noUpcomingMatches: 'No Upcoming Matches Scheduled',
    noUpcomingMatchesDescAdmin: 'Click "Schedule Match" above to set up the next pitch reservation on any date or time.',
    noUpcomingMatchesDescMember: 'Your group Owner or Admin has not posted any upcoming matches yet. Check back soon!',
    scheduleFirstMatch: 'Schedule First Match',
    matchOpenSpots: (n) => `OPEN • ${n} SPOT${n === 1 ? '' : 'S'} LEFT`,
    matchFull: 'MATCH FULL (12/12)',
    matchCancelled: 'CANCELLED',
    matchStarted: 'MATCH STARTED',
    youAreBooked: 'You Are Booked',
    playersCount: (c, max) => `${c}/${max} Players`,
    viewDetails: 'View Details & Squad Lineup →',
    modalMatchStarted: 'Match Started • Booking Closed',
    modalSquadLineup: (max) => `Squad Lineup (${max} Slots)`,
    modalSpotsInfo: (confirmed, open) => `${confirmed} Confirmed • ${open} Open`,
    modalFirstComeNotice: 'First come, first served • No waiting list',
    modalClaimSpotBtn: (slot, max) => `Instant Claim Spot (#${slot} of ${max})`,
    modalClaiming: 'Claiming spot...',
    modalYouAreBooked: 'You Have a Confirmed Spot',
    modalCancelSpotBtn: 'Cancel My Spot (Reopen Slot)',
    modalCancelling: 'Reopening slot...',
    modalMatchNotes: 'Pitch Instructions & Gear',
    modalEditMatch: 'Edit Match',
    modalCancelMatch: 'Cancel Match',
    modalReopenMatch: 'Reopen Match',
    modalClose: 'Close',
    openSlotVisual: '+ Open Spot',
    confirmedPlayerVisual: 'Confirmed Player',
    createModalTitle: 'Schedule Football Match',
    editModalTitle: 'Edit Match Details',
    fieldTitle: 'Match Title',
    fieldVenue: 'Venue & Pitch Details',
    fieldDate: 'Date (Any Day)',
    fieldTime: 'Kickoff Time',
    fieldDuration: 'Duration',
    fieldMaxPlayers: 'Max Capacity (Default: 12)',
    fieldNotes: 'Match Notes & Rules (Optional)',
    saveMatchBtn: 'Save Match',
    cancelBtn: 'Cancel',
    myBookingsHeader: 'My Bookings',
    myBookingsSubheader: 'Matches you have claimed an active slot for. One spot per player per match.',
    activeSpotsCount: (n) => `${n} Active Spots`,
    noActiveBookings: 'No Active Bookings',
    noActiveBookingsDesc: 'You haven\'t claimed a spot in any upcoming matches yet. Browse upcoming matches to book.',
    browseMatchesBtn: 'Browse Upcoming Matches',
    spotConfirmedBadge: 'Spot Confirmed',
    cancelMySpot: 'Cancel My Spot',
    squadHeader: 'Squad & Permissions',
    squadSubheader: 'Private circle membership. Only approved players can view & book matches.',
    activePlayersCount: (n) => `${n} Active Players`,
    tabRoster: (n) => `Squad Roster (${n})`,
    tabPending: (n) => `Pending Approvals (${n})`,
    tabInviteSettings: 'Invite Settings',
    shareWhatsAppBtn: 'Share on WhatsApp',
    copyInviteBtn: 'Copy WhatsApp Invite',
    inviteCopied: 'Invite Link Copied!',
    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleMember: 'Member',
    makeAdmin: 'Make Admin',
    demoteToMember: 'Demote',
    removeFromSquad: 'Remove',
    approveMember: 'Approve Member',
    rejectMember: 'Reject',
    allRequestsReviewed: 'All requests have been reviewed. No pending approvals.',
    activeGroupCode: 'Active Group Code',
    regenerateCodeBtn: 'Regenerate Code',
    alertsHeader: 'Notification Center',
    alertsSubheader: 'Universal cancellation broadcast: all approved squad members get alerted when a spot opens.',
    unreadBadge: (n) => `${n} Unread`,
    markAllReadBtn: 'Mark all read',
    deleteAllAlertsBtn: 'Clear all alerts',
    confirmDeleteAllAlerts: 'Are you sure you want to delete all notifications?',
    deleteAlertTooltip: 'Delete alert',
    deviceAlertsTitle: 'Device Push Alerts',
    deviceAlertsDesc: 'Receive instant phone/desktop notifications whenever someone cancels a match.',
    enableAlertsBtn: 'Enable Device Alerts',
    alertsEnabled: 'Enabled',
    alertsBlocked: 'Blocked',
    alertsNotEnabled: 'Not Enabled',
    iphoneNotice: 'iPhone note: On iOS 16.4+, web push requires adding PitchPass to your Home Screen via Safari (Share ⎋ → Add to Home Screen).',
    noAlertsYet: 'No Notifications Yet',
    noAlertsYetDesc: 'When a player cancels their spot, an instant alert will appear here for all squad members.',
    claimSpotFromAlert: 'View Open Spot & Claim',
    roleOwnerFull: '👑 Group Owner',
    roleAdminFull: '🛡️ Admin',
    roleMemberFull: '⚽ Member',
    ownerActiveBannerTitle: 'Owner Dashboard Active • Master Owner Bootstrapped',
    ownerActiveBannerDesc: 'Authenticated as Group Owner. Full match administration and squad approval permissions are active.',
    // PWA Banner
    pwaInstallTitle: 'Install PitchPass App',
    pwaInstallDesc: 'Instant match bookings & spot notifications from your home screen',
    pwaInstallBtn: 'Install App',
    pwaIosTitle: 'Install on iPhone (Safari)',
    pwaIosStep1: 'Tap the Share button ⎋ in the Safari toolbar below',
    pwaIosStep2: 'Scroll down and select "Add to Home Screen"',
    pwaIosStep3: 'Tap "Add" in the top right to launch as a standalone app',
    pwaIosGotIt: 'Got it',
    // Squad additions
    playerCol: 'Player Details',
    roleCol: 'Role & Management',
    youTag: '(You)',
    demoteBtn: 'Demote',
    makeAdminBtn: 'Make Admin',
    removeTooltip: 'Remove from squad',
    pendingHeader: (n) => `Pending Join Requests (${n})`,
    pendingSubNotice: 'Approve once for all matches',
    awaitingReview: 'Awaiting Review',
    requestedAtPrefix: 'Requested:',
    rejectBtn: 'Reject',
    approveBtn: 'Approve Member',
    whatsappInviteTitle: 'WhatsApp Invite Settings',
    whatsappInviteDesc: 'Share this invite link with your football circle on WhatsApp. Anyone with this link can request to join.',
    activeCodeLabel: 'Active Group Code',
    shareableLinkLabel: 'Shareable Link',
    copiedBtn: 'Copied!',
    copyBtn: 'Copy',
    shareDirectWhatsapp: 'Share Directly to WhatsApp Group',
    // MyBookings additions
    oneSpotPerMatchNotice: 'One confirmed spot per match. One-tap instant cancellation opens the slot for the squad.',
    capacityFilled: 'Filled',
    bookedAtPrefix: 'Booked:',
    // MatchModal additions
    matchModalSubtitle: 'Any date & time • Default 12 players • No waiting lists',
    fieldTitlePlaceholder: 'e.g. Tuesday Night 6v6 Under The Lights',
    fieldVenuePlaceholder: 'e.g. Dubai Sports City • Pitch 4 (Turf)',
    fieldKickoffTime: 'Kickoff Time',
    fieldDateAny: 'Date (Any Day)',
    minsLabel: 'mins',
    minWarningCap: 'Strict capacity cap active to prevent 13th player overbooking.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Arabic ('ar') as requested by user!
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('pitchpass_lang');
    return (saved === 'en' ? 'en' : 'ar') as Language;
  });

  const isRTL = language === 'ar';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pitchpass_lang', lang);
  };

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
