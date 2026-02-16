import { describe, expect, it, vi } from 'vitest';

import { renderToStaticMarkup } from 'react-dom/server';

import { ClickKpiCards } from './ClickKpiCards';
import { ConversionMatrix } from './ConversionMatrix';
import { DateFilter } from './DateFilter';
import { GrowthConversionMatrix } from './GrowthConversionMatrix';
import { GrowthKpiCards } from './GrowthKpiCards';
import { KpiCards } from './KpiCards';

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

  it('renders click KPI cards snapshot', () => {
    const html = renderToStaticMarkup(
      <ClickKpiCards
        totals={{
          navSignup: 5,
          navRequest: 4,
          navPricing: 3,
          mobileMenuOpen: 2,
          mobileMenuCta: 1,
          total: 15,
        }}
      />,
    );

    expect(html).toMatchSnapshot();
  });

  it('renders growth KPI cards snapshot', () => {
    const html = renderToStaticMarkup(
      <GrowthKpiCards
        kpis={{
          organicVisit: 12,
          availabilityCtaClick: 8,
          signupCompleted: 4,
          firstAlertCreated: 2,
          totalAlertsCreated: 5,
          alertsPerUser: 2.5,
        }}
      />,
    );

    expect(html).toMatchSnapshot();
  });

  it('renders growth conversion matrix snapshot', () => {
    const html = renderToStaticMarkup(
      <GrowthConversionMatrix
        conversion={{
          visitToSignup: 0.333,
          signupToAlert: 0.5,
          visitToAlert: 0.167,
          ctaToSignup: 0.5,
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
