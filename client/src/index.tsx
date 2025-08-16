import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from "./App";
import axios from "axios";
import './index.css';

// Material-UI 테마 설정 - 모던하고 세련된 디자인
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50', // 진한 네이비 블루
      light: '#34495e',
      dark: '#1a252f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e74c3c', // 세련된 레드
      light: '#ec7063',
      dark: '#c0392b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
    },
    divider: '#ecf0f1',
  },
  typography: {
    fontSize: 13,
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    body1: {
      fontSize: '0.875rem',
      color: '#2c3e50',
    },
    body2: {
      fontSize: '0.8125rem',
      color: '#7f8c8d',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#7f8c8d',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '0.875rem',
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#34495e',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #ecf0f1',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderBottom: '1px solid #ecf0f1',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f8f9fa',
          color: '#2c3e50',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontSize: '0.875rem',
            fontWeight: 600,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#2c3e50',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #ecf0f1',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#f8f9fa',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
  },
});

// Axios 기본 설정 - 현재 호스트에 따라 동적으로 설정
const currentHost = window.location.hostname;
const serverPort = '3001';
axios.defaults.baseURL = `http://${currentHost}:${serverPort}`;

// axios 인터셉터는 auth.ts의 setupAxiosInterceptors에서 처리됩니다.

const router = createBrowserRouter([
  {
    path: "/*",
    element: <App />,
  }
], {
  future: {
    v7_relativeSplatPath: true
  }
});

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <RouterProvider router={router} />
  </ThemeProvider>
); 