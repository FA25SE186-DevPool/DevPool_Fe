import LoginForm from "../../../components/auth/LoginForm"
import logoDevPool from "../../../assets/images/logo-DevPool.jpg"

export default function Auth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary-500 rounded-full blur-xl animate-float"></div>
          <div
            className="absolute top-32 right-20 w-16 h-16 bg-secondary-500 rounded-full blur-xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-500 rounded-full blur-xl animate-float"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        <div className="w-full max-w-md">
            <LoginForm/>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 items-center justify-center p-12 relative overflow-hidden border-l-4 border-gradient-to-b">
        {/* Geometric Background Pattern */}
        <div className="absolute inset-0">
          {/* Animated geometric shapes */}
          <div className="absolute top-16 left-16 w-24 h-24 border-2 border-cyan-400/30 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 border-2 border-blue-400/20 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-float"></div>
          <div
            className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg rotate-12 animate-float"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
              {[...Array(64)].map((_, i) => (
                <div key={i} className="border border-white/10"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-white space-y-8 relative z-10 max-w-lg">
          {/* New Logo Design */}
          <div className="space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl transform rotate-3 animate-bounce-gentle border border-white/20 flex items-center justify-center p-2">
                <img 
                  src={logoDevPool} 
                  alt="DevPool Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
            </div>

            <div className="space-y-3">
              <h2 className="text-5xl font-bold leading-tight animate-fade-in-up">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                  DevPool
                </span>
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto rounded-full"></div>
              <p
                className="text-lg text-slate-300 leading-relaxed animate-fade-in-up font-light"
                style={{ animationDelay: "0.2s" }}
              >
                Kết nối tài năng IT với cơ hội vàng
              </p>
            </div>
          </div>

          {/* Enhanced Image Section */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <img
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                alt="DevPool Innovation"
                className="relative rounded-2xl shadow-2xl max-w-sm mx-auto transform group-hover:scale-105 transition-all duration-500 border-2 border-white/20"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>

            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-300 blur"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-xl p-5 border border-white/10 hover:border-cyan-400/50 transition-all duration-300">
                  <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    2K+
                  </div>
                  <div className="text-slate-300 text-sm">Dự án hoàn thành</div>
                  <div className="mt-2 w-full bg-slate-700 rounded-full h-1">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full w-4/5 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-75 group-hover:opacity-100 transition duration-300 blur"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-xl p-5 border border-white/10 hover:border-blue-400/50 transition-all duration-300">
                  <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    800+
                  </div>
                  <div className="text-slate-300 text-sm">Chuyên gia IT</div>
                  <div className="mt-2 w-full bg-slate-700 rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-indigo-500 h-1 rounded-full w-3/4 animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Rating Display */}
            {/* <div
              className="flex items-center justify-center space-x-3 animate-fade-in-up bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
              <span className="text-slate-200 text-sm font-medium">4.9/5 từ 1,200+ đánh giá</span>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}
