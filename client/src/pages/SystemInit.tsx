import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const SystemInit: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    try {
      await axios.post('/api/init/system', {
        company: { name: formData.companyName },
        user: { username: formData.username, password: formData.password }
      });
      navigate('/login');
    } catch (error) {
      setError(t('initError'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 360, borderRadius: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          {t('systemInitialization')}
        </Typography>
        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
          {t('createInitialAdminAccount')}
        </Typography>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label={t('companyName')}
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label={t('username')}
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label={t('password')}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label={t('confirmPassword')}
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            {t('initialize')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default SystemInit; 