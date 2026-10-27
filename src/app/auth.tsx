import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { login, register } = useAuth();

  // Chế độ: 'login' (Đăng nhập) hoặc 'register' (Đăng ký)
  const [mode, setMode] = useState<AuthMode>('login');

  // State form Đăng nhập
  const [loginStudentId, setLoginStudentId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // State form Đăng ký
  const [registerName, setRegisterName] = useState('');
  const [registerStudentId, setRegisterStudentId] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Trạng thái xử lý và thông báo lỗi/thành công
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Điều hướng thành công
  const handleSuccessRedirect = () => {
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tabs' as any);
      }
    }, 400);
  };

  // Đổi tab
  const switchMode = (newMode: AuthMode) => {
    if (mode === newMode) return;
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Xử lý nút quay lại
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/tabs' as any);
    }
  };

  // Xử lý Đăng nhập
  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const studentIdClean = loginStudentId.trim().toUpperCase();
    if (!studentIdClean) {
      setErrorMessage('Vui lòng nhập Mã sinh viên!');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Vui lòng nhập Mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(studentIdClean, loginPassword);
      if (result.success) {
        setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');
        handleSuccessRedirect();
      } else {
        setErrorMessage(result.error || 'Mã sinh viên hoặc mật khẩu không chính xác!');
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi trong quá trình kết nối. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Đăng ký
  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameClean = registerName.trim();
    const studentIdClean = registerStudentId.trim().toUpperCase();
    const phoneClean = registerPhone.trim();

    if (!nameClean) {
      setErrorMessage('Vui lòng nhập Họ và tên!');
      return;
    }

    if (!studentIdClean) {
      setErrorMessage('Vui lòng nhập Mã sinh viên (VD: B21DCCN001)!');
      return;
    }

    if (!registerPassword) {
      setErrorMessage('Vui lòng nhập Mật khẩu!');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage('Mật khẩu cần có tối thiểu 6 ký tự để bảo mật!');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu đã nhập!');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        name: nameClean,
        studentId: studentIdClean,
        password: registerPassword,
        phone: phoneClean.length > 0 ? phoneClean : undefined,
      });

      if (result.success) {
        setSuccessMessage('Tạo tài khoản thành công! Đang chuyển hướng...');
        handleSuccessRedirect();
      } else {
        setErrorMessage(result.error || 'Không thể tạo tài khoản. Vui lòng thử lại!');
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Quay lại"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.topBarBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={[styles.topBarBadgeText, { color: colors.primary }]}>Sinh viên xác thực</Text>
            </View>
          </View>

          {/* Hero Branding */}
          <View style={styles.brandingContainer}>
            <View
              style={[
                styles.logoCircle,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: isDark ? colors.border : '#DBEAFE',
                },
              ]}
            >
              <Ionicons name="school" size={44} color={colors.primary} />
            </View>

            <Text style={[styles.brandTitle, Typography.title, { color: colors.text }]}>
              Campus Marketplace
            </Text>
            <Text style={[styles.brandSubtitle, Typography.body, { color: colors.textSecondary }]}>
              Cổng thông tin trao đổi, mua bán đồ dùng sinh viên uy tín và tiện lợi
            </Text>
          </View>

          {/* Tab Selector */}
          <View
            style={[
              styles.tabSelectorContainer,
              {
                backgroundColor: isDark ? colors.surface : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'login' && [
                  styles.tabButtonActive,
                  { backgroundColor: isDark ? colors.primaryLight : colors.surface },
                ],
              ]}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-in-outline"
                size={18}
                color={mode === 'login' ? colors.primary : colors.textSecondary}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  Typography.subTitle,
                  {
                    color: mode === 'login' ? colors.primary : colors.textSecondary,
                    fontWeight: mode === 'login' ? '700' : '500',
                  },
                ]}
              >
                Đăng nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'register' && [
                  styles.tabButtonActive,
                  { backgroundColor: isDark ? colors.primaryLight : colors.surface },
                ],
              ]}
              onPress={() => switchMode('register')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color={mode === 'register' ? colors.primary : colors.textSecondary}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  Typography.subTitle,
                  {
                    color: mode === 'register' ? colors.primary : colors.textSecondary,
                    fontWeight: mode === 'register' ? '700' : '500',
                  },
                ]}
              >
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  borderColor: isDark ? colors.price : '#FCA5A5',
                },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color={colors.price} style={styles.alertIcon} />
              <Text style={[styles.alertText, Typography.caption, { color: colors.price }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Thông báo thành công nếu có */}
          {successMessage && (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
                  borderColor: '#86EFAC',
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={styles.alertIcon} />
              <Text style={[styles.alertText, Typography.caption, { color: '#15803D' }]}>
                {successMessage}
              </Text>
            </View>
          )}

          {/* Form Content */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            {mode === 'login' ? (
              /* FORM ĐĂNG NHẬP */
              <View style={styles.form}>
                <Text style={[styles.formHeader, Typography.subTitle, { color: colors.text }]}>
                  Chào mừng bạn quay lại! 👋
                </Text>

                {/* Ô nhập Mã Sinh Viên */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, Typography.caption, { color: colors.text }]}>
                    MÃ SINH VIÊN <Text style={{ color: colors.price }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.inputField, Typography.body, { color: colors.text }]}
                      placeholder="VD: B21DCCN001"
                      placeholderTextColor={colors.textSecondary}
                      value={loginStudentId}
                      onChangeText={(text) => {
                        setLoginStudentId(text.toUpperCase());
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                {/* Ô nhập Mật Khẩu */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, Typography.caption, { color: colors.text }]}>
                    MẬT KHẨU <Text style={{ color: colors.price }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.inputField, Typography.body, { color: colors.text }]}
                      placeholder="Nhập mật khẩu của bạn"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showLoginPassword}
                      value={loginPassword}
                      onChangeText={(text) => {
                        setLoginPassword(text);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                      editable={!isSubmitting}
                    />
                    <TouchableOpacity
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                      style={styles.eyeIconBtn}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Nút Đăng nhập */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: isSubmitting ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Text style={[styles.primaryButtonText, Typography.subTitle]}>
                        Đăng nhập ngay
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Gợi ý đổi tab */}
                <View style={styles.switchPromptContainer}>
                  <Text style={[styles.switchPromptText, Typography.body, { color: colors.textSecondary }]}>
                    Chưa có tài khoản sinh viên?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => switchMode('register')}>
                    <Text
                      style={[
                        styles.switchPromptLink,
                        Typography.body,
                        { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      Đăng ký ngay
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* FORM ĐĂNG KÝ */
              <View style={styles.form}>
                <Text style={[styles.formHeader, Typography.subTitle, { color: colors.text }]}>
                  Tạo tài khoản sinh viên mới 🎓
                </Text>

                {/* Ô nhập Họ và tên */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, Typography.caption, { color: colors.text }]}>
                    HỌ VÀ TÊN <Text style={{ color: colors.price }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.inputField, Typography.body, { color: colors.text }]}
                      placeholder="VD: Nguyễn Văn A"
                      placeholderTextColor={colors.textSecondary}
                      value={registerName}
                      onChangeText={(text) => {
                        setRegisterName(text);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="words"
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                {/* Ô nhập Mã Sinh Viên */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, Typography.caption, { color: colors.text }]}>
                    MÃ SINH VIÊN (MSSV) <Text style={{ color: colors.price }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="school-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.inputField, Typography.body, { color: colors.text }]}
                      placeholder="VD: B21DCCN001"
                      placeholderTextColor={colors.textSecondary}
                      value={registerStudentId}
                      onChangeText={(text) => {
                        setRegisterStudentId(text.toUpperCase());
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                {/* Ô nhập Số điện thoại */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, Typography.caption, { color: colors.text }]}>
                    SỐ ĐIỆN THOẠI (ZALO LIÊN HỆ)
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.inputField, Typography.body, { color: colors.text }]}
                      placeholder="VD: 0912345678"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="phone-pad"
                      value={registerPhone}
                      onChangeText={(text) => {
                        setRegisterPhone(text);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                {/* Ô nhập Mật Khẩu */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, Typography.caption, { color: colors.text }]}>
                    MẬT KHẨU <Text style={{ color: colors.price }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.inputField, Typography.body, { color: colors.text }]}
                      placeholder="Tối thiểu 6 ký tự"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showRegisterPassword}
                      value={registerPassword}
                      onChangeText={(text) => {
                        setRegisterPassword(text);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                      editable={!isSubmitting}
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegisterPassword(!showRegisterPassword)}
                      style={styles.eyeIconBtn}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={showRegisterPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Ô Xác nhận Mật Khẩu */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, Typography.caption, { color: colors.text }]}>
                    XÁC NHẬN MẬT KHẨU <Text style={{ color: colors.price }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.inputField, Typography.body, { color: colors.text }]}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showRegisterConfirmPassword}
                      value={registerConfirmPassword}
                      onChangeText={(text) => {
                        setRegisterConfirmPassword(text);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                      editable={!isSubmitting}
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      style={styles.eyeIconBtn}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={showRegisterConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Nút Tạo tài khoản */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: isSubmitting ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleRegister}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Text style={[styles.primaryButtonText, Typography.subTitle]}>
                        Tạo tài khoản sinh viên
                      </Text>
                      <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Gợi ý đổi tab */}
                <View style={styles.switchPromptContainer}>
                  <Text style={[styles.switchPromptText, Typography.body, { color: colors.textSecondary }]}>
                    Đã có tài khoản?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => switchMode('login')}>
                    <Text
                      style={[
                        styles.switchPromptLink,
                        Typography.body,
                        { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      Đăng nhập ngay
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.footerNoteText, Typography.caption, { color: colors.textSecondary }]}>
              Dữ liệu tài khoản được lưu trữ an toàn trực tiếp trên thiết bị qua SQLite.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl * 1.5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: 4,
  },
  topBarBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  brandingContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  brandSubtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
  },
  tabSelectorContainer: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    marginVertical: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.sm + 2,
  },
  tabButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    letterSpacing: 0.2,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  alertIcon: {
    marginRight: Spacing.sm,
  },
  alertText: {
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  form: {
    gap: Spacing.md,
  },
  formHeader: {
    marginBottom: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 4,
    minHeight: 48,
  },
  inputLeadingIcon: {
    marginRight: Spacing.sm,
  },
  inputField: {
    flex: 1,
    paddingVertical: 10,
  },
  eyeIconBtn: {
    padding: 4,
    marginLeft: 4,
  },
  primaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  switchPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  switchPromptText: {},
  switchPromptLink: {
    paddingVertical: 4,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  footerNoteText: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
