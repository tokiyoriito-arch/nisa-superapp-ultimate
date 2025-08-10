
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { primary:{DEFAULT:"#0ea5e9",700:"#0284c7"}, text:"#0f172a", muted:"#64748b", border:"#e2e8f0" },
      fontFamily: { sans:['ui-sans-serif','system-ui','-apple-system','BlinkMacSystemFont','"Segoe UI"','Roboto','"Noto Sans JP"','"Hiragino Sans"','"Helvetica Neue"','Arial','"Apple Color Emoji"','"Segoe UI Emoji"','"Segoe UI Symbol"', 'sans-serif'] }
    }
  },
  plugins: []
};
