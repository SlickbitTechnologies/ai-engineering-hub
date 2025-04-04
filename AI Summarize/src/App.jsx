import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import theme from './theme';
import Header from './components/Header';
import AnimatedBackground from './components/AnimatedBackground';
import Home from './pages/Home';
import Summarize from './pages/Summarize';
import History from './pages/History';
import WebsiteSummary from './pages/WebsiteSummary';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AnimatedBackground />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/summarize/website" element={<WebsiteSummary />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 