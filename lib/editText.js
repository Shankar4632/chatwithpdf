// Text layout shared by the PDF editor (on screen) and lib/editPdf.js (in the saved file).
export const TEXT_FONT = "Helvetica, Arial, sans-serif";
export const LINE_HEIGHT = 1.2;
// Where the first baseline sits below the top of a text box, as a fraction of the font
// size, given Helvetica/Arial's ascent (0.905) and descent (0.212) and LINE_HEIGHT.
export const BASELINE = (LINE_HEIGHT - (0.905 + 0.212)) / 2 + 0.905;
