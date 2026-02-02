export type Shoutout = {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  image: string | null; // base64 string
  frame: string; // frame id
  createdAt: number; // timestamp
};

export type ShoutoutFrame = {
  id: string;
  name: string;
  className: string;
};
