import React from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (lang: 'ko' | 'en') => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <Box>
      <Button
        color="inherit"
        startIcon={<TranslateIcon />}
        onClick={handleClick}
        sx={{ minWidth: 'auto', px: 1 }}
      >
        {language === 'ko' ? '한국어' : 'English'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleLanguageSelect('ko')} selected={language === 'ko'}>
          <ListItemIcon>
            <Box component="span" sx={{ fontSize: '1.2rem' }}>🇰🇷</Box>
          </ListItemIcon>
          <ListItemText>{t('korean')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageSelect('en')} selected={language === 'en'}>
          <ListItemIcon>
            <Box component="span" sx={{ fontSize: '1.2rem' }}>🇺🇸</Box>
          </ListItemIcon>
          <ListItemText>{t('english')}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSelector; 