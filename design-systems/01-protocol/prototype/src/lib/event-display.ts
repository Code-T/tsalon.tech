const DEFAULT_TIME_ZONE = 'Asia/Shanghai';

export function formatEventDate(
  date: Date,
  locale: string,
  timeZone = DEFAULT_TIME_ZONE,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' },
) {
  return date.toLocaleDateString(locale, { ...options, timeZone });
}

export function formatEventTimeRange(start: Date, end: Date, timeZone = DEFAULT_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const startDay = formatEventDate(start, 'zh-CN', timeZone);
  const endDay = formatEventDate(end, 'zh-CN', timeZone);
  const endLabel = startDay === endDay ? formatter.format(end) : `${endDay} ${formatter.format(end)}`;
  return `${formatter.format(start)}—${endLabel}`;
}

type Registration = { status: 'open' | 'waitlist' | 'closed' | 'archived'; deadline?: Date };

export function getEventState(endDate: Date, registration: Registration, now = Date.now()) {
  const ended = endDate.getTime() <= now || registration.status === 'archived';
  const deadlinePassed = registration.deadline !== undefined && registration.deadline.getTime() <= now;
  const status = ended ? 'ended' : deadlinePassed ? 'closed' : registration.status;
  return { status, ended, registrationOpen: status === 'open' || status === 'waitlist' };
}

export function getVisibleEventFaq<T extends { question: string; answer: string }>(faq: T[], registrationOpen: boolean): T[] {
  if (registrationOpen) return faq;
  return faq.filter(({ question }) => {
    // Explicit historical questions remain useful in the archive.
    if (/当时|曾经|当年|历史|at the time|previous/i.test(question)) return true;
    return !/(?:如何|怎么|怎样|哪里|在哪|何时|什么时候|还能|能否).{0,16}(?:报名|预约|参加)|(?:报名|预约).{0,16}(?:方式|入口|链接|截止|时间)|地址.*(?:什么时候|何时)|准备什么.*参加|\b(?:how|where|when|can).*\b(?:register|registration|sign up|attend)|\bwhat.*\b(?:bring|prepare).*\b(?:attend|event|join)|\bwhen.*\b(?:get|receive).*\baddress/i.test(question);
  });
}
