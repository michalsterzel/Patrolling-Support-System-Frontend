import { Avatar, Box, Button, Container, CssBaseline, Grid, Link, TextField, ThemeProvider, Typography, createTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";


export function ChangePasswordForm() {

    const [showPopup, setShowPopup] = useState(false);    
      function handlePopupClose() {
        setShowPopup(false);
      }

    const [email, setEmail] = useState("");
    const handleEmailChange = (event) => {
        setEmail(event.target.value);
      };

    const navigate = useNavigate();

    const handleBackToLogInClick = () => {
        navigate("/");
      };

    const handleSendPasswordResetLink = (data) =>{
        const auth = getAuth();
        sendPasswordResetEmail(auth, data.get('email'))
        .then(() => {
            console.log("Password reset link sent")
        })
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        handleSendPasswordResetLink(data);
        setShowPopup(true);
      };

    const theme = createTheme({
        palette: {
          primary: {
            main: "#E8E1DB"
          },
          secondary: {
            main: "#A9AC5D"
          }
        },
      });


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
            <Typography component="h1" variant="h5">
                Change password
            </Typography>
            {/* <Typography variant="subtitle1" align="center">
                No worries. We'll send you a password reset link.
              </Typography> */}
            <Box component="form"  noValidate sx={{ mt: 1 }} onSubmit={handleSubmit}>
                <TextField
                margin="normal"
                required
                fullWidth
                id="new_password"
                label="New password"
                name="new_password"
                autoFocus
                bgcolor={"secondary.main"}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Confirm password"
                  type="password"
                  id="password"
                />
                <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                color="secondary"
                >
                Send link
                </Button>
                {/* {showPopup && (<Popup message="Password reset link sent!" onClose={handlePopupClose} />)} */}
                <Grid container>
                <Grid item xs>
                    <Link href="#" variant="body2" color={'secondary'} onClick={handleBackToLogInClick} >
                    Back to home page
                    </Link>
                </Grid>
                </Grid>
            </Box>
            </Box>
        </Container>
        </ThemeProvider>
  );
}