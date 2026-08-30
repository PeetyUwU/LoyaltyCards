'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
	code: string;
	barcodeType?: string | null; // e.g. 'QR_CODE', 'EAN13', 'CODE128', 'UPC', 'CODE39'
}

function normalizeBarcodeFormat(type?: string | null): string {
	if (!type) return 'CODE128';
	const clean = type.toUpperCase().replace(/[-_\s]/g, '');

	if (clean.includes('QR')) return 'QR';
	if (clean.includes('EAN13')) return 'EAN13';
	if (clean.includes('EAN8')) return 'EAN8';
	if (clean.includes('UPCA') || clean === 'UPC') return 'UPC';
	if (clean.includes('UPCE')) return 'UPCE';
	if (clean.includes('CODE39')) return 'CODE39';
	if (clean.includes('ITF')) return 'ITF';
	if (clean.includes('MSI')) return 'MSI';
	if (clean.includes('PHARMA')) return 'pharmacode';

	return 'CODE128';
}

export default function BarcodeDisplay({ code, barcodeType }: Props) {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [renderError, setRenderError] = useState(false);
	const format = normalizeBarcodeFormat(barcodeType);

	useEffect(() => {
		setRenderError(false);

		if (format === 'QR' || !svgRef.current || !code) return;

		try {
			JsBarcode(svgRef.current, code, {
				format: format,
				displayValue: true,
				font: 'monospace',
				fontSize: 14,
				textMargin: 6,
				margin: 10,
				background: '#ffffff',
				lineColor: '#000000',
				width: 2,
				height: 80,
			});
		} catch {
			// Fallback to Code 128 if specific standard (like EAN-13 check digit) fails validation
			try {
				if (svgRef.current) {
					JsBarcode(svgRef.current, code, {
						format: 'CODE128',
						displayValue: true,
						font: 'monospace',
						fontSize: 14,
						textMargin: 6,
						margin: 10,
						background: '#ffffff',
						lineColor: '#000000',
						width: 2,
						height: 80,
					});
				}
			} catch {
				setRenderError(true);
			}
		}
	}, [code, format]);

	if (format === 'QR') {
		return (
			<div className='flex flex-col items-center justify-center p-2'>
				<div className='bg-white p-4 rounded-xl shadow-inner border border-zinc-200'>
					<QRCodeSVG
						value={code}
						size={180}
						level='M'
						includeMargin={false}
					/>
				</div>
				<p className='mt-3 font-mono font-bold text-base tracking-widest text-zinc-900 select-all'>
					{code}
				</p>
			</div>
		);
	}

	if (renderError) {
		return (
			<div className='py-6 px-4 text-center'>
				<p className='font-mono text-2xl font-bold tracking-widest text-zinc-900 select-all'>
					{code}
				</p>
				<p className='text-xs text-zinc-400 mt-1'>
					Barcode preview unavailable
				</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center overflow-x-auto p-1'>
			<svg ref={svgRef} className='max-w-full h-auto rounded-lg' />
		</div>
	);
}
