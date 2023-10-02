import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { Grid } from '@mui/material';
import { InputAdornment } from '@mui/material';
import {TextField} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase-config.js";


const theme = createTheme({
  palette: {
    primary: {
      main: "#A9AC5D"
    },
    secondary: {
      main: "#E8E1DB"
    },
    tertiary: {
      default: "#3A3C26"
    },
    background: {
      default: "#E8E1DB"
    },
  },
});

export function AccountSettings() {

  const navigate = useNavigate();

  const handleReturnClick = () => {
    navigate("/home")
  }

  const handleChangePasswordClick = () => {
    navigate("/changePassword")
  }

  const getUserEmail = async (auth) => {
    const user = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      return user.email;
  }

  const [userEmail, setUserEmail] = React.useState('');

  React.useEffect(() => {
    async function fetchUserEmail() {
      const email = await getUserEmail(auth);
      setUserEmail(email);
    }

    fetchUserEmail();
  }, [auth]);



  

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="absolute"
        color="primary"
        elevation={0}
        sx={{
          position: 'relative',
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton>
            <ArrowBackIosIcon onClick={() => handleReturnClick()}/>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="md" sx={{ mb: 4 }}>
        <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
          <Typography component="h1" variant="h4" align="center">
            User Account Settings
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
      <React.Fragment>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={10} margin={8}>
              <TextField
                inputProps={{min: 0, style: {textAlign: 'center'}}}
                variant='outlined'
                margin="normal"
                fullWidth
                rows={1}
                // value={auth.currentUser.email}
                value={userEmail}
                disabled
                InputProps={{
                  startAdornment:(
                    <React.Fragment>
                      <InputAdornment position="start">
                        <Typography>
                          User email: 
                        </Typography>
                      </InputAdornment>
                      <Divider orientation='vertical' flexItem/>
                    </React.Fragment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                    <Button variant="contained" color="primary">
                      Change
                    </Button>
                  </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={10} margin={8}>
                <Button 
                variant="contained" 
                color="primary"
                fullWidth
                onClick={handleChangePasswordClick}
                >
                  Change password
                </Button>
            </Grid>
          </Grid>
      </React.Fragment>
    </Box>
        </Paper>
      </Container>
    </ThemeProvider>
    );
  }