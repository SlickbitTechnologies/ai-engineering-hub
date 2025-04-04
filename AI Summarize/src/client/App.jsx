import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Header from '../components/Header';
import Home from '../pages/Home';
import History from '../pages/History';
import WebsiteSummary from '../pages/WebsiteSummary';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
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