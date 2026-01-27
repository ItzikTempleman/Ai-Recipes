import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import "./ConfirmDialog.css";
import { useTranslation } from "react-i18next";


type Props = {
  open: boolean;
  message?: string;       
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ open, message, onCancel, onConfirm }: Props) {
  const { t } = useTranslation();

  const text = message ?? t("drawer.areYouSure");

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t("drawer.areYouSure")}</DialogTitle>

      <DialogContent>
        <Typography>{text}</Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>{t("drawer.cancel")}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {t("drawer.yes")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}