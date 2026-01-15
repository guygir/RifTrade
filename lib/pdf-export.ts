/**
 * PDF Export utility for card lists
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type CardForExport = {
  id: string;
  name: string;
  image_url: string | null;
  rarity: string | null;
  quantity?: number;
  public_code?: string | null;
  set_code?: string;
  collector_number?: string;
  metadata?: Record<string, any> | null;
};

type SortOrder = 'default';

/**
 * Load image and convert to base64
 * Uses API proxy to bypass CORS restrictions
 */
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use our API proxy to bypass CORS
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Error loading image via proxy:', error);
      // Fallback: try direct URL (might work for some servers)
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = fallbackImg.naturalWidth || fallbackImg.width;
          canvas.height = fallbackImg.naturalHeight || fallbackImg.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(fallbackImg, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.9);
            resolve(base64);
          } else {
            reject(new Error('Could not get canvas context'));
          }
        } catch (e) {
          reject(e);
        }
      };
      fallbackImg.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      fallbackImg.src = url;
    };
    
    img.src = proxyUrl;
  });
}

/**
 * Rotate image on canvas by 90 degrees
 */
function rotateImage90Degrees(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas with swapped dimensions for 90-degree rotation
        const canvas = document.createElement('canvas');
        canvas.width = img.height;
        canvas.height = img.width;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Translate to center of rotation
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Rotate 90 degrees clockwise
        ctx.rotate(Math.PI / 2);
        // Draw image (adjust position since we rotated around center)
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        const rotatedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(rotatedBase64);
      } catch (error) {
        console.error('Error rotating image:', error);
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for rotation'));
    img.src = imageData;
  });
}

/**
 * Add a card image to the PDF
 */
async function addCardToPDF(
  doc: jsPDF,
  card: CardForExport,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  if (card.image_url) {
    try {
      let imageData = await loadImageAsBase64(card.image_url);
      
      // Check if card is a Battlefield type and needs rotation
      const cardType = card.metadata?.classification?.type || card.metadata?.type;
      const isBattlefield = cardType === 'Battlefield';
      
      if (isBattlefield) {
        // Rotate the image 90 degrees
        imageData = await rotateImage90Degrees(imageData);
      }
      
      doc.addImage(imageData, 'JPEG', x, y, width, height);
      
      // Add quantity badge if quantity > 1
      if (card.quantity && card.quantity > 1) {
        doc.setFillColor(37, 99, 235); // Blue
        doc.circle(x + width - 5, y + 5, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(card.quantity.toString(), x + width - 5, y + 6.5, {
          align: 'center',
        });
        doc.setTextColor(0, 0, 0);
      }
    } catch (error) {
      console.error(`Error loading image for ${card.name}:`, error);
      // Draw placeholder
      doc.setFillColor(200, 200, 200);
      doc.rect(x, y, width, height, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Image not available', x + width / 2, y + height / 2, {
        align: 'center',
      });
      doc.setTextColor(0, 0, 0);
    }
  } else {
    // No image - draw placeholder
    doc.setFillColor(200, 200, 200);
    doc.rect(x, y, width, height, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('No image', x + width / 2, y + height / 2, {
      align: 'center',
    });
    doc.setTextColor(0, 0, 0);
  }
}

/**
 * Generate PDF for card list
 */
export async function generateCardListPDF(
  cards: CardForExport[],
  title: 'Cards I Have' | 'Cards I Want',
  onProgress?: (progress: number) => void
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // Header - use production URL
  const headerText = `This file was generated by https://rif-trade.vercel.app - RifTrade - Riftbound Card Swap app! Join us today :)`;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(headerText, margin, margin + 5, { maxWidth: contentWidth });

  // Title
  let yPos = margin + 15;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(title, margin, yPos);
  yPos += 10;

  // Keep cards in original order (default)
  const sortedCards = [...cards];

  // Card image dimensions (same as Cards page - approximately 63:88 aspect ratio)
  const cardWidth = 35; // mm (slightly smaller to fit better)
  const cardHeight = (cardWidth * 88) / 63; // Maintain aspect ratio
  const horizontalSpacing = 5; // mm between cards
  const cardsPerRow = Math.floor((contentWidth + horizontalSpacing) / (cardWidth + horizontalSpacing));
  const spacing = cardsPerRow > 1 
    ? (contentWidth - (cardsPerRow * cardWidth)) / (cardsPerRow - 1)
    : 0;

  let currentX = margin;
  let currentY = yPos;
  let cardsProcessed = 0;

  // Process cards
  if (sortedCards.length === 0) {
    doc.setFontSize(12);
    doc.text('No cards to display', margin, yPos);
    doc.save(`rif-trade-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    return;
  }

  // Add cards in default order
  for (let i = 0; i < sortedCards.length; i++) {
    const card = sortedCards[i];
    
    // Check if we need a new row (start of row or after cardsPerRow cards)
    if (i > 0 && i % cardsPerRow === 0) {
      currentX = margin;
      currentY += cardHeight + 5;
    }

    // Check if we need a new page
    if (currentY + cardHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      currentX = margin;
    }

    await addCardToPDF(doc, card, currentX, currentY, cardWidth, cardHeight);

    currentX += cardWidth + spacing;
    cardsProcessed++;
    
    // Update progress
    if (onProgress) {
      const progress = Math.round((cardsProcessed / sortedCards.length) * 100);
      onProgress(progress);
    }
  }

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `rif-trade-${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`;

  // Save PDF
  doc.save(filename);
}

/**
 * Generate and download text file with card names
 */
export function generateCardListTextFile(
  cards: CardForExport[],
  title: 'Cards I Have' | 'Cards I Want',
  getCardDisplayName: (card: CardForExport) => string
): void {
  try {
    const lines: string[] = [];
    
    cards.forEach(card => {
      const displayName = getCardDisplayName(card);
      if (card.quantity && card.quantity > 1) {
        lines.push(`${displayName} (x${card.quantity})`);
      } else {
        lines.push(displayName);
      }
    });
    
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `rif-trade-${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.txt`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error generating text file:', error);
    throw error;
  }
}
