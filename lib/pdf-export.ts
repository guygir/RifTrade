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
 * Load image and convert to base64 with optimized size
 * Uses API proxy to bypass CORS restrictions
 * @param url - Image URL
 * @param maxWidth - Maximum width in pixels (default: 400)
 * @param maxHeight - Maximum height in pixels (default: 560)
 * @param quality - JPEG quality 0-1 (default: 0.75)
 */
async function loadImageAsBase64(
  url: string,
  maxWidth: number = 400,
  maxHeight: number = 560,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use our API proxy to bypass CORS
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Calculate optimal dimensions while maintaining aspect ratio
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const aspectRatio = width / height;
        
        // Resize if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
            if (height > maxHeight) {
              height = maxHeight;
              width = height * aspectRatio;
            }
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
            if (width > maxWidth) {
              width = maxWidth;
              height = width / aspectRatio;
            }
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use better image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Use lower quality for smaller file size
        const base64 = canvas.toDataURL('image/jpeg', quality);
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
          // Same optimization logic
          let width = fallbackImg.naturalWidth || fallbackImg.width;
          let height = fallbackImg.naturalHeight || fallbackImg.height;
          const aspectRatio = width / height;
          
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              width = Math.min(width, maxWidth);
              height = width / aspectRatio;
              if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
              }
            } else {
              height = Math.min(height, maxHeight);
              width = height * aspectRatio;
              if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
              }
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(fallbackImg, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', quality);
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
function rotateImage90Degrees(imageData: string, quality: number = 0.75): Promise<string> {
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
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Translate to center of rotation
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Rotate 90 degrees clockwise
        ctx.rotate(Math.PI / 2);
        // Draw image (adjust position since we rotated around center)
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        const rotatedBase64 = canvas.toDataURL('image/jpeg', quality);
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
      // Calculate optimal image dimensions in pixels (35mm = ~132px at 96 DPI, but we'll use higher for quality)
      // PDF card width is 35mm, which is about 132 pixels at 96 DPI, but we'll use 300 DPI for better quality
      // 35mm at 300 DPI = ~413 pixels, but we'll cap at 400 for optimization
      const maxWidthPx = 400;
      const maxHeightPx = Math.round(maxWidthPx * (height / width)); // Maintain aspect ratio
      
      let imageData = await loadImageAsBase64(card.image_url, maxWidthPx, maxHeightPx, 0.75);
      
      // Check if card is a Battlefield type and needs rotation
      const cardType = card.metadata?.classification?.type || card.metadata?.type;
      const isBattlefield = cardType === 'Battlefield';
      
      if (isBattlefield) {
        // Rotate the image 90 degrees
        imageData = await rotateImage90Degrees(imageData, 0.75);
      }
      
      doc.addImage(imageData, 'JPEG', x, y, width, height, undefined, 'FAST');
      
      // Check if card is foil (has "(foil)" in name)
      const isFoil = card.name.toLowerCase().includes('(foil)');
      
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
      
      // Add FOIL badge if card is foil
      if (isFoil) {
        doc.setFillColor(37, 99, 235); // Blue (same as quantity badge)
        const foilBadgeWidth = 12;
        const foilBadgeHeight = 5;
        const foilBadgeX = x + 2;
        const foilBadgeY = y + 2;
        // Draw rounded rectangle (if method exists) or regular rectangle
        if (typeof (doc as any).roundedRect === 'function') {
          (doc as any).roundedRect(foilBadgeX, foilBadgeY, foilBadgeWidth, foilBadgeHeight, 1, 1, 'F');
        } else {
          doc.rect(foilBadgeX, foilBadgeY, foilBadgeWidth, foilBadgeHeight, 'F');
        }
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text('FOIL', foilBadgeX + foilBadgeWidth / 2, foilBadgeY + 3.5, {
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
