export const SUBSCRIPTION_PLAN_KEY = 'intended_subscription_plan';

export const setIntendedSubscription = (planType: 'monthly' | 'yearly' | 'trial') => {
  localStorage.setItem(SUBSCRIPTION_PLAN_KEY, planType);
};

export const getIntendedSubscription = (): 'monthly' | 'yearly' | 'trial' => {
  return localStorage.getItem(SUBSCRIPTION_PLAN_KEY) as 'monthly' | 'yearly' | 'trial';
};

export const clearIntendedSubscription = () => {
  localStorage.removeItem(SUBSCRIPTION_PLAN_KEY);
};

export const shouldContinueSubscription = (): boolean => {
  return !!getIntendedSubscription();
};