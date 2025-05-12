import { makeStyles } from "@mui/styles"

const useStyles = makeStyles((theme) => ({
    loaderOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#00000036",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "1000",
        transition: "opacity 0.3s ease"
    },
    loader: {
        background: "#fff",
        padding: theme.spacing(2),
        borderRadius: theme.spacing(1),
    },
    loaderSpinner: {
        width: 50,
        height: 50,
        animation: "$rotate 2s linear infinite", // 👈 Animate full SVG
    },
    loaderCircle: {
        stroke: "currentColor",
        strokeWidth: 4,
        strokeLinecap: "round",
        fill: "none",
        strokeDasharray: "90, 150",
        strokeDashoffset: "0",
        animation: "$dash 1.5s ease-in-out infinite"
    },
    "@keyframes rotate": {
        "100%": { transform: "rotate(360deg)" }
    },
    "@keyframes dash": {
        "0%": {
            strokeDasharray: "1, 150",
            strokeDashoffset: 0,
        },
        "50%": {
            strokeDasharray: "90, 150",
            strokeDashoffset: "-35",
        },
        "100%": {
            strokeDasharray: "90, 150",
            strokeDashoffset: "-124",
        }
    }
}))


export default function ActivityLoader() {
    const classes = useStyles();

    return (
        <div className={classes.loaderOverlay}>
            <div className={classes.loader}>
                <svg
                    className={classes.loaderSpinner}
                    viewBox="0 0 50 50"
                    style={{ transformOrigin: "center center" }}
                >
                    <circle
                        className={classes.loaderCircle}
                        cx="25"
                        cy="25"
                        r="20"
                    />
                </svg>
            </div>
        </div>
    )
}
