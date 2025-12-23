import { useState } from "react";
import { AlertCircle, CheckCircle, KeyRound, X } from "lucide-react";
import { userService } from "../../services/User";
import { getPasswordValidationError } from "../../utils/validators";

export function ChangePasswordSection({ userId }: { userId: string | null }) {
  // Validate password strength using common utility
  const validatePassword = (password: string): string => {
    return getPasswordValidationError(password);
  };

  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);


  const close = () => {
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    setSaving(false);
    setShowSuccessOverlay(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!userId) {
      setError("Không thể xác định người dùng.");
      return;
    }

    const currentPwd = currentPassword.trim();
    const pwd = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!currentPwd) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!pwd) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    const passwordValidationError = validatePassword(pwd);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }
    if (pwd !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      setSaving(true);
      await userService.changePassword(userId, {
        currentPassword: currentPwd,
        newPassword: pwd,
        confirmPassword: confirm
      });

      setSuccess(true);
      setShowSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi đóng modal
      setTimeout(() => {
        setShowSuccessOverlay(false);
        close();
      }, 2000);
    } catch (err: any) {
      // Xử lý thông báo lỗi từ backend
      let errorMessage = err?.message || "Không thể đổi mật khẩu.";

      // Nếu lỗi liên quan đến mật khẩu hiện tại không đúng
      if (errorMessage.toLowerCase().includes('current password') ||
          errorMessage.toLowerCase().includes('mật khẩu hiện tại') ||
          errorMessage.toLowerCase().includes('wrong password') ||
          errorMessage.toLowerCase().includes('incorrect password')) {
        errorMessage = "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.";
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
        <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <KeyRound className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Bảo mật</h2>
              <p className="text-sm text-neutral-600">Đổi mật khẩu đăng nhập</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition font-medium"
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-neutral-600">
            Bạn nên sử dụng mật khẩu mạnh và không dùng lại mật khẩu cũ.
          </p>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) close();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h3>
              <button
                type="button"
                onClick={close}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Đóng"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="px-6 py-4 space-y-4">
              {success ? (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">Đổi mật khẩu thành công!</p>
                </div>
              ) : null}
              {error ? (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Nhập mật khẩu hiện tại"
                  autoComplete="off"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Nhập lại mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  disabled={saving}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition font-medium disabled:opacity-50"
                >
                  {saving ? "Đang đổi..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Success Loading Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đổi mật khẩu thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


