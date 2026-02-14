import { describe, expect, it, vi } from 'vitest';

import { renderToStaticMarkup } from 'react-dom/server';

import { ConversionMatrix } from './conversion-matrix';
import { DateFilter } from './date-filter';
import { KpiCards } from './kpi-cards';

describe('admin/funnel components', () => {
  it('renders KPI cards snapshot', () => {
    const html = renderToStaticMarkup(
      <KpiCards
        kpis={{
          submitted: 7,
          processed: 6,
          paymentConfirmed: 2,
          conditionMet: 1,
        }}
      />,
    );

    expect(html).toMatchSnapshot();
  });

  it('renders conversion matrix snapshot', () => {
    const html = renderToStaticMarkup(
      <ConversionMatrix
        conversion={{
          submittedToProcessed: 0.857,
          processedToPaymentConfirmed: 0.333,
          paymentConfirmedToConditionMet: 0.5,
          submittedToConditionMet: 0.143,
        }}
      />,
    );

    expect(html).toMatchSnapshot();
  });

  it('renders date filter snapshot', () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(<DateFilter value='30d' onChange={onChange} />);

    expect(html).toMatchSnapshot();
  });
});
