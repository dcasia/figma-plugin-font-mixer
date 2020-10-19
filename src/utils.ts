export function hexToFigmaRGB(h: string): {r: number, g: number, b: number} {
    
    let r = '', g = '', b = '';
  
    if (h.length == 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];
  
    } else if (h.length == 7) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }

    return {r: +r/255, g: +g/255, b: +b/255}

}