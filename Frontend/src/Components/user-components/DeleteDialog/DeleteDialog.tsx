import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import "./DeleteDialog.css";
import { useTranslation } from "react-i18next";


type Props = {
  open: boolean;     
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteDialog({ open, onCancel, onConfirm }: Props) {
  const { t } = useTranslation();


  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t("drawer.areYouSure")}</DialogTitle>

      <DialogContent>
        <Typography>{t("drawer.message")}</Typography>
        <Typography>{t("drawer.message2")}</Typography>
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