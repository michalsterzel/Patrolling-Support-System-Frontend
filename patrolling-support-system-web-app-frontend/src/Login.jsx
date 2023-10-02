import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { Grid } from '@mui/material';
import {Link} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase-config.js";
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

const theme = createTheme({
  palette: {
    primary: {
      main: "#E8E1DB"
    },
    secondary: {
      main: "#A9AC5D"
    },
  },
});

export function Login() {

  const navigate = useNavigate();

  const handleLoginClick = () => {
    if (auth.currentUser){
      navigate("/home");
    }
  };

  const handleForgotPasswordClick = () => {
    navigate("/ResetPassword");
  };


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth , (user) => {
      if (user) {
        navigate("/home", {replace: true})
      }
    });

    return () => unsubscribe();
  }, [navigate]);

    const logIn = async (data) => {
      try {
        const user = await signInWithEmailAndPassword(
          auth,
          data.get('email'),
          data.get('password')
        );
        handleLoginClick();
      } catch (error) {
        console.log(error.message);
      }
    };


  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    logIn(data);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              bgcolor={"secondary.main"}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              color="secondary"
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2" color={'secondary'} onClick={handleForgotPasswordClick}>
                  Forgot password?
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}