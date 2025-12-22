        })()}
      </div>

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cáº¥p tÃ i khoáº£n cho Ä‘á»‘i tÃ¡c</h3>
              <button onClick={() => setShowCreateAccount(null)} className="p-2 rounded-lg hover:bg-gray-100">
                âœ•
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">{showCreateAccount?.companyName}</div>
                    <div className="text-sm text-blue-700">MÃ£: {showCreateAccount?.code}</div>
                    {showCreateAccount?.contactPerson && (
                      <div className="text-sm text-blue-700">Äáº¡i diá»‡n: {showCreateAccount?.contactPerson}</div>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const email = formData.get('email') as string;

                if (email && showCreateAccount) {
                  // Validate email before proceeding
                  if (!validateEmail(email)) {
                    setEmailError('Email khÃ´ng há»£p lá»‡');
                    return;
                  }
                  const originalEmail = showCreateAccount.email || '';
                  const emailChanged = email.trim() !== originalEmail.trim();

                  // Build confirmation message
                  let confirmMessage = `Báº¡n cÃ³ cháº¯c muá»‘n cáº¥p tÃ i khoáº£n cho Ä‘á»‘i tÃ¡c "${showCreateAccount.companyName}"?\n\n`;
                  confirmMessage += `Email tÃ i khoáº£n: ${email}\n`;

                  if (emailChanged) {
                    confirmMessage += `âš ï¸ Email sáº½ Ä‘Æ°á»£c cáº­p nháº­t tá»« "${originalEmail}" thÃ nh "${email}"\n`;
                  }

                  confirmMessage += `\nMáº­t kháº©u sáº½ Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng vÃ  gá»­i qua email nÃ y.`;

                  const confirmed = window.confirm(confirmMessage);
                  if (confirmed) {
                    handleCreateAccount(showCreateAccount, email);
                  }
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={showCreateAccount?.email || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.trim() === '') {
                          setEmailError('Email lÃ  báº¯t buá»™c');
                        } else if (!validateEmail(value)) {
                          setEmailError('Email khÃ´ng há»£p lá»‡');
                        } else {
                          setEmailError('');
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                        emailError ? 'border-red-500' : 'border-neutral-300'
                      }`}
                      placeholder="Nháº­p email Ä‘á»ƒ cáº¥p tÃ i khoáº£n (Ä‘Ã£ Ä‘iá»n sáºµn)"
                    />
                    {emailError && (
                      <p className="text-xs text-red-600 mt-1">{emailError}</p>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500">
                    Máº­t kháº©u sáº½ Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng vÃ  gá»­i qua email nÃ y. Náº¿u báº¡n thay Ä‘á»•i email, há»‡ thá»‘ng sáº½ cáº­p nháº­t email cá»§a Ä‘á»‘i tÃ¡c.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAccount(null)}
                    disabled={creatingAccount}
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Há»§y
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAccount}
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingAccount ? 'Äang cáº¥p...' : 'Cáº¥p tÃ i khoáº£n'}
                  </button>
                </div>
              </form>
            </div>

            {/* Loading Overlay */}
            {creatingAccount && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-700">Äang cáº¥p tÃ i khoáº£n...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerManagementPage;
