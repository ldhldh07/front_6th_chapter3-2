import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { screen, within, waitFor, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import { handlers } from '../../../__mocks__/handlers';
import {
  setupMockHandlerCreation,
  setupMockHandlerUpdating,
} from '../../../__mocks__/handlersUtils';
import { setupMockHandlerDeletion } from '../../../__mocks__/handlersUtils';
import App from '../../../App';
import { server } from '../../../setupTests';
import { makeEvent } from '../../utils';

const theme = createTheme();

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

describe('반복 UI 및 표시', () => {
  it('반복 일정 체크 시 반복 유형/종료일 입력 UI가 노출된다', async () => {
    const { user } = setup(<App />);

    const repeatToggle = await screen.findByLabelText('반복 일정');
    await user.click(repeatToggle);

    expect(await screen.findByRole('combobox', { name: '반복 유형' })).toBeInTheDocument();
    expect(screen.getByLabelText('반복 종료일')).toBeInTheDocument();
  });

  it('반복 일정을 저장하면 캘린더 셀에 반복 아이콘(↻)이 표시된다', async () => {
    setupMockHandlerCreation();

    vi.setSystemTime(new Date('2025-10-15'));

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '반복 회의');
    await user.type(screen.getByLabelText('날짜'), '2025-10-15');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');
    await user.type(screen.getByLabelText('설명'), '반복 테스트');
    await user.type(screen.getByLabelText('위치'), '회의실 C');

    await user.click(screen.getByLabelText('카테고리'));
    await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '업무-option' }));

    const repeatToggle = await screen.findByLabelText('반복 일정');
    await user.click(repeatToggle);
    await user.click(await screen.findByRole('combobox', { name: '반복 유형' }));
    await user.click(screen.getByRole('option', { name: '매주' }));

    await user.click(screen.getByTestId('event-submit-button'));

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));
    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getAllByLabelText('반복 일정 아이콘').length).toBeGreaterThan(0);
  });

  it('반복 일정을 단일 수정으로 저장하면 반복 아이콘이 사라진다', async () => {
    setupMockHandlerUpdating();

    vi.setSystemTime(new Date('2025-10-15'));

    const { user } = setup(<App />);

    await user.click((await screen.findAllByLabelText('Edit event'))[0]);
    const repeatToggle = await screen.findByLabelText('반복 일정');
    await user.click(repeatToggle);
    await user.click(await screen.findByRole('combobox', { name: '반복 유형' }));
    await user.click(screen.getByRole('option', { name: '매주' }));
    await user.click(screen.getByTestId('event-submit-button'));

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));
    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getAllByLabelText('반복 일정 아이콘').length).toBeGreaterThan(0);

    await user.click((await screen.findAllByLabelText('Edit event'))[0]);
    const repeatToggle2 = await screen.findByLabelText('반복 일정');
    await user.click(repeatToggle2);
    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(weekView.queryByLabelText('반복 일정 아이콘')).not.toBeInTheDocument();
    });
  });

  it('반복일정을 단일 삭제하면 해당 날짜 셀에서만 사라진다', async () => {
    // 현재 주간 뷰 범위에 10/16, 10/17이 포함되도록 고정
    vi.setSystemTime(new Date('2025-10-16'));

    // 반복: daily 10/15 시작 ~ 10/22 종료, 서버에는 베이스 이벤트 1건만 존재
    const series = makeEvent({
      id: 'r1',
      title: '반복 삭제 테스트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-22' },
    });

    setupMockHandlerCreation([series]);

    const { user } = setup(<App />);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'month-option' }));
    const monthView = within(screen.getByTestId('month-view'));

    const day16Cell = within(monthView.getByText('16').closest('td')!);
    await waitFor(() => expect(day16Cell.getByText('반복 삭제 테스트')).toBeInTheDocument());

    const day17Cell = within(monthView.getByText('17').closest('td')!);
    await waitFor(() => expect(day17Cell.getByText('반복 삭제 테스트')).toBeInTheDocument());

    let mockEvents = [series];

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: mockEvents });
      }),
      http.delete('/api/events/:id', ({ params }) => {
        const { id } = params;
        mockEvents = mockEvents.filter((event) => event.id !== id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const deleteBtn = screen.getByRole('button', {
      name: 'Delete event 2025-10-16',
    });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(day16Cell.queryByText('반복 삭제 테스트')).not.toBeInTheDocument();
      expect(day17Cell.getByText('반복 삭제 테스트')).toBeInTheDocument();
    });
  });
});
