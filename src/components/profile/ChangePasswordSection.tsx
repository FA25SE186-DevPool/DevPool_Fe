import { useState } from "react";
import { AlertCircle, CheckCircle, KeyRound, X } from "lucide-react";
import { userService } from "../../services/User";

export function ChangePasswordSection({ userId }: { userId: string | null }) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const close = () => {
    setOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    setSaving(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!userId) {
      setError("Không thể xác định người dùng.");
      return;
    }

    const pwd = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!pwd) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (pwd.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (pwd !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      setSaving(true);
      await userService.resetPassword(userId, pwd);
      setSuccess(true);
      setTimeout(() => close(), 900);
    } catch (err: any) {
      setError(err?.message || "Không thể đổi mật khẩu.");
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
    </>
  );
}


