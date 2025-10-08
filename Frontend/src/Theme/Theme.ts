import {createTheme} from "@mui/material";

export const muiTheme = createTheme({
    direction: `rtl`,
    palette: {
        primary: {
            main: "#1e5b8c"
        },
        secondary: {
            main: "#b2f3fd"
        }
    },
    typography: {
        allVariants: {
            fontFamily: "Arial",
            textTransform: "none"
        }
    },
    components: {}

});
