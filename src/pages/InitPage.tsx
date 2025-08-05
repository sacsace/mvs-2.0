import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography } from "@mui/material";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
// TODO: 실제 API 연동 필요
const createInitialUser = async (form: any) => {
  // 임시: 실제로는 API 호출
  await new Promise((res) => setTimeout(res, 500));
};

export default function InitPage() {
  const [form, setForm] = useState({ company: "", adminId: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInitialUser(form);
    navigate("/login");
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <Logo />
      <Typography variant="h5" mb={2}>System Initialization</Typography>
      <form onSubmit={handleSubmit} style={{ width: 320 }}>
        <TextField label="Company Name" name="company" value={form.company} onChange={handleChange} required fullWidth margin="normal" />
        <TextField label="Admin ID" name="adminId" value={form.adminId} onChange={handleChange} required fullWidth margin="normal" />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth margin="normal" />
        <Button type="submit" variant="contained" color="primary" fullWidth>Initialize</Button>
      </form>
      <Footer />
    </Box>
  );
} 