import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { screen, within, waitFor, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerUpdating,
} from '../../../__mocks__/handlersUtils';
import App from '../../../App';

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

  it('반복 일정을 저장하면 리스트에 반복 아이콘(↻)이 표시된다 (Red)', async () => {
    setupMockHandlerCreation();

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

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByLabelText('반복 일정 아이콘')).toBeInTheDocument();
  });

  it('반복 일정을 단일 수정으로 저장하면 반복 아이콘이 사라진다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    // 먼저 기존 이벤트를 반복 이벤트로 변경하여 아이콘이 보이도록 만든다
    await user.click((await screen.findAllByLabelText('Edit event'))[0]);
    const repeatToggle = await screen.findByLabelText('반복 일정');
    await user.click(repeatToggle);
    await user.click(await screen.findByRole('combobox', { name: '반복 유형' }));
    await user.click(screen.getByRole('option', { name: '매주' }));
    await user.click(screen.getByTestId('event-submit-button'));

    const list = within(screen.getByTestId('event-list'));
    expect(await list.findByLabelText('반복 일정 아이콘')).toBeInTheDocument();

    await user.click((await screen.findAllByLabelText('Edit event'))[0]);
    const repeatToggle2 = await screen.findByLabelText('반복 일정');
    await user.click(repeatToggle2); // 체크 해제
    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(list.queryByLabelText('반복 일정 아이콘')).not.toBeInTheDocument();
    });
  });
});
