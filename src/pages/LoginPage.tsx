import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
// TODO: useAuth 훅 구현 필요
const login = async (id: string, password: string) => {
  // 임시: 실제로는 API 호출
  await new Promise((res) => setTimeout(res, 500));
};

export default function LoginPage() {
  const [form, setForm] = useState({ id: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form.id, form.password);
    // TODO: 로그인 성공 시 메인 페이지로 이동
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <Logo />
      <Typography variant="h5" mb={2}>Sign In</Typography>
      <form onSubmit={handleSubmit} style={{ width: 320 }}>
        <TextField label="User ID" name="id" value={form.id} onChange={handleChange} required fullWidth margin="normal" />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth margin="normal" />
        <Button type="submit" variant="contained" color="primary" fullWidth>Login</Button>
      </form>
      <Footer />
    </Box>
  );
} 